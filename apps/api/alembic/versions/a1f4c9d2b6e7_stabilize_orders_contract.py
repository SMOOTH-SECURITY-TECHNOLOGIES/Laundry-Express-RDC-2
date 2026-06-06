"""Stabilize orders contract and monetary precision

Revision ID: a1f4c9d2b6e7
Revises: 88e66e4b89ee
Create Date: 2026-03-18 18:25:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "a1f4c9d2b6e7"
down_revision = "88e66e4b89ee"
branch_labels = None
depends_on = None


ORDER_STATUS_VALUES = (
    "draft",
    "pending_confirmation",
    "confirmed",
    "pickup_scheduled",
    "pickup_driver_assigned",
    "pickup_in_progress",
    "picked_up",
    "received_by_partner",
    "cleaning_in_progress",
    "quality_check",
    "ready_for_delivery",
    "delivery_driver_assigned",
    "delivery_in_progress",
    "delivered",
    "completed",
    "cancelled",
    "failed",
    "disputed",
)

PAYMENT_STATUS_VALUES = (
    "pending",
    "authorized",
    "partially_paid",
    "paid",
    "cash_pending",
    "failed",
    "refunded",
    "partially_refunded",
    "cancelled",
)


def _quoted_csv(values: tuple[str, ...]) -> str:
    return ", ".join(f"'{value}'" for value in values)


def _column_exists(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _constraint_exists(
    inspector: sa.Inspector,
    table_name: str,
    constraint_name: str,
    *,
    constraint_type: str,
) -> bool:
    if constraint_type == "check":
        constraints = inspector.get_check_constraints(table_name)
    elif constraint_type == "unique":
        constraints = inspector.get_unique_constraints(table_name)
    else:
        raise ValueError(f"Unsupported constraint type: {constraint_type}")
    return any(constraint["name"] == constraint_name for constraint in constraints)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _column_exists(inspector, "orders", "idempotency_key"):
        op.add_column("orders", sa.Column("idempotency_key", sa.String(length=128), nullable=True))
    if not _column_exists(inspector, "orders", "amount_paid"):
        op.add_column(
            "orders",
            sa.Column("amount_paid", sa.Numeric(10, 2), nullable=False, server_default="0.00"),
        )
    if not _column_exists(inspector, "orders", "refunded_amount"):
        op.add_column(
            "orders",
            sa.Column("refunded_amount", sa.Numeric(10, 2), nullable=False, server_default="0.00"),
        )
    if not _column_exists(inspector, "orders", "calculation_breakdown"):
        op.add_column(
            "orders",
            sa.Column(
                "calculation_breakdown",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=True,
            ),
        )
    if not _column_exists(inspector, "orders", "express"):
        op.add_column(
            "orders",
            sa.Column("express", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    if not _column_exists(inspector, "orders", "pickup_requested"):
        op.add_column(
            "orders",
            sa.Column("pickup_requested", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    if not _column_exists(inspector, "orders", "delivery_requested"):
        op.add_column(
            "orders",
            sa.Column("delivery_requested", sa.Boolean(), nullable=False, server_default=sa.true()),
        )

    op.execute("UPDATE orders SET amount_paid = 0.00 WHERE amount_paid IS NULL")
    op.execute("UPDATE orders SET refunded_amount = 0.00 WHERE refunded_amount IS NULL")
    op.execute("UPDATE orders SET express = FALSE WHERE express IS NULL")
    op.execute("UPDATE orders SET pickup_requested = TRUE WHERE pickup_requested IS NULL")
    op.execute("UPDATE orders SET delivery_requested = TRUE WHERE delivery_requested IS NULL")

    op.execute(
        "ALTER TABLE orders ALTER COLUMN subtotal_amount TYPE NUMERIC(10,2) USING ROUND(subtotal_amount::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN discount_amount TYPE NUMERIC(10,2) USING ROUND(discount_amount::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN pickup_fee TYPE NUMERIC(10,2) USING ROUND(pickup_fee::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN delivery_fee TYPE NUMERIC(10,2) USING ROUND(delivery_fee::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN total_amount TYPE NUMERIC(10,2) USING ROUND(total_amount::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN amount_paid TYPE NUMERIC(10,2) USING ROUND(amount_paid::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN refunded_amount TYPE NUMERIC(10,2) USING ROUND(refunded_amount::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE order_items ALTER COLUMN quantity TYPE NUMERIC(10,2) USING ROUND(quantity::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE order_items ALTER COLUMN unit_price TYPE NUMERIC(10,2) USING ROUND(unit_price::numeric, 2)"
    )
    op.execute(
        "ALTER TABLE order_items ALTER COLUMN line_total TYPE NUMERIC(10,2) USING ROUND(line_total::numeric, 2)"
    )

    op.alter_column("orders", "amount_paid", nullable=False)
    op.alter_column("orders", "refunded_amount", nullable=False)
    op.alter_column("orders", "express", nullable=False)
    op.alter_column("orders", "pickup_requested", nullable=False)
    op.alter_column("orders", "delivery_requested", nullable=False)

    inspector = sa.inspect(bind)

    if not _constraint_exists(inspector, "orders", "uq_orders_idempotency_key", constraint_type="unique"):
        op.create_unique_constraint(
            "uq_orders_idempotency_key",
            "orders",
            ["idempotency_key"],
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_status_allowed", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_status_allowed",
            "orders",
            f"status IN ({_quoted_csv(ORDER_STATUS_VALUES)})",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_payment_status_allowed", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_payment_status_allowed",
            "orders",
            f"payment_status IN ({_quoted_csv(PAYMENT_STATUS_VALUES)})",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_subtotal_non_negative", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_subtotal_non_negative",
            "orders",
            "subtotal_amount >= 0",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_discount_non_negative", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_discount_non_negative",
            "orders",
            "discount_amount >= 0",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_pickup_fee_non_negative", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_pickup_fee_non_negative",
            "orders",
            "pickup_fee >= 0",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_delivery_fee_non_negative", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_delivery_fee_non_negative",
            "orders",
            "delivery_fee >= 0",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_total_non_negative", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_total_non_negative",
            "orders",
            "total_amount >= 0",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_amount_paid_non_negative", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_amount_paid_non_negative",
            "orders",
            "amount_paid >= 0",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_refunded_amount_non_negative", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_refunded_amount_non_negative",
            "orders",
            "refunded_amount >= 0",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_amount_paid_lte_total", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_amount_paid_lte_total",
            "orders",
            "amount_paid <= total_amount",
        )
    if not _constraint_exists(inspector, "orders", "ck_orders_refunded_amount_lte_paid", constraint_type="check"):
        op.create_check_constraint(
            "ck_orders_refunded_amount_lte_paid",
            "orders",
            "refunded_amount <= amount_paid",
        )

    op.alter_column("orders", "amount_paid", server_default=None)
    op.alter_column("orders", "refunded_amount", server_default=None)
    op.alter_column("orders", "express", server_default=None)
    op.alter_column("orders", "pickup_requested", server_default=None)
    op.alter_column("orders", "delivery_requested", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_orders_refunded_amount_lte_paid", "orders", type_="check")
    op.drop_constraint("ck_orders_amount_paid_lte_total", "orders", type_="check")
    op.drop_constraint("ck_orders_refunded_amount_non_negative", "orders", type_="check")
    op.drop_constraint("ck_orders_amount_paid_non_negative", "orders", type_="check")
    op.drop_constraint("ck_orders_total_non_negative", "orders", type_="check")
    op.drop_constraint("ck_orders_delivery_fee_non_negative", "orders", type_="check")
    op.drop_constraint("ck_orders_pickup_fee_non_negative", "orders", type_="check")
    op.drop_constraint("ck_orders_discount_non_negative", "orders", type_="check")
    op.drop_constraint("ck_orders_subtotal_non_negative", "orders", type_="check")
    op.drop_constraint("ck_orders_payment_status_allowed", "orders", type_="check")
    op.drop_constraint("ck_orders_status_allowed", "orders", type_="check")
    op.drop_constraint("uq_orders_idempotency_key", "orders", type_="unique")

    op.execute(
        "ALTER TABLE order_items ALTER COLUMN line_total TYPE DOUBLE PRECISION USING line_total::double precision"
    )
    op.execute(
        "ALTER TABLE order_items ALTER COLUMN unit_price TYPE DOUBLE PRECISION USING unit_price::double precision"
    )
    op.execute(
        "ALTER TABLE order_items ALTER COLUMN quantity TYPE DOUBLE PRECISION USING quantity::double precision"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN total_amount TYPE DOUBLE PRECISION USING total_amount::double precision"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN delivery_fee TYPE DOUBLE PRECISION USING delivery_fee::double precision"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN pickup_fee TYPE DOUBLE PRECISION USING pickup_fee::double precision"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN discount_amount TYPE DOUBLE PRECISION USING discount_amount::double precision"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN subtotal_amount TYPE DOUBLE PRECISION USING subtotal_amount::double precision"
    )

    op.drop_column("orders", "delivery_requested")
    op.drop_column("orders", "pickup_requested")
    op.drop_column("orders", "express")
    op.drop_column("orders", "calculation_breakdown")
    op.drop_column("orders", "refunded_amount")
    op.drop_column("orders", "amount_paid")
    op.drop_column("orders", "idempotency_key")
