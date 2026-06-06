"""Align payment tables with service contract

Revision ID: b2e4f6a9c1d3
Revises: a1f4c9d2b6e7
Create Date: 2026-03-18 18:15:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "b2e4f6a9c1d3"
down_revision = "a1f4c9d2b6e7"
branch_labels = None
depends_on = None


def _column_exists(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _index_exists(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _column_exists(inspector, "payment_intents", "customer_id"):
        op.add_column("payment_intents", sa.Column("customer_id", sa.UUID(), nullable=True))
    if not _column_exists(inspector, "payment_intents", "payment_method"):
        op.add_column("payment_intents", sa.Column("payment_method", sa.String(length=50), nullable=True))
    if not _column_exists(inspector, "payment_intents", "amount_expected"):
        op.add_column("payment_intents", sa.Column("amount_expected", sa.Float(), nullable=True))
    if not _column_exists(inspector, "payment_intents", "amount_paid"):
        op.add_column("payment_intents", sa.Column("amount_paid", sa.Float(), nullable=False, server_default="0"))
    if not _column_exists(inspector, "payment_intents", "provider_name"):
        op.add_column("payment_intents", sa.Column("provider_name", sa.String(length=50), nullable=True))
    if not _column_exists(inspector, "payment_intents", "provider_reference"):
        op.add_column("payment_intents", sa.Column("provider_reference", sa.String(length=255), nullable=True))
    if not _column_exists(inspector, "payment_intents", "expires_at"):
        op.add_column("payment_intents", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    if not _column_exists(inspector, "payment_intents", "paid_at"):
        op.add_column("payment_intents", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        UPDATE payment_intents pi
        SET customer_id = o.customer_id
        FROM orders o
        WHERE pi.order_id = o.id
          AND pi.customer_id IS NULL
        """
    )
    op.execute("UPDATE payment_intents SET payment_method = 'mobile_money' WHERE payment_method IS NULL")
    op.execute("UPDATE payment_intents SET amount_expected = amount WHERE amount_expected IS NULL AND amount IS NOT NULL")
    op.execute("UPDATE payment_intents SET amount_paid = 0 WHERE amount_paid IS NULL")
    op.execute("UPDATE payment_intents SET provider_name = provider WHERE provider_name IS NULL AND provider IS NOT NULL")
    op.execute(
        """
        UPDATE payment_intents
        SET provider_reference = provider_payment_id
        WHERE provider_reference IS NULL
          AND provider_payment_id IS NOT NULL
        """
    )

    op.alter_column("payment_intents", "customer_id", nullable=False)
    op.alter_column("payment_intents", "payment_method", nullable=False)
    op.alter_column("payment_intents", "amount_expected", nullable=False)
    op.alter_column("payment_intents", "amount_paid", server_default=None)

    inspector = sa.inspect(bind)
    if not _index_exists(inspector, "payment_intents", "ix_payment_intents_customer_id"):
        op.create_index("ix_payment_intents_customer_id", "payment_intents", ["customer_id"], unique=False)

    if not _column_exists(inspector, "payment_transactions", "order_id"):
        op.add_column("payment_transactions", sa.Column("order_id", sa.UUID(), nullable=True))
    if not _column_exists(inspector, "payment_transactions", "transaction_type"):
        op.add_column("payment_transactions", sa.Column("transaction_type", sa.String(length=50), nullable=True))
    if not _column_exists(inspector, "payment_transactions", "provider_name"):
        op.add_column("payment_transactions", sa.Column("provider_name", sa.String(length=50), nullable=True))
    if not _column_exists(inspector, "payment_transactions", "raw_provider_payload"):
        op.add_column("payment_transactions", sa.Column("raw_provider_payload", sa.Text(), nullable=True))
    if not _column_exists(inspector, "payment_transactions", "failure_reason"):
        op.add_column("payment_transactions", sa.Column("failure_reason", sa.Text(), nullable=True))
    if not _column_exists(inspector, "payment_transactions", "processed_at"):
        op.add_column("payment_transactions", sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        UPDATE payment_transactions pt
        SET order_id = pi.order_id
        FROM payment_intents pi
        WHERE pt.payment_intent_id = pi.id
          AND pt.order_id IS NULL
        """
    )
    op.execute("UPDATE payment_transactions SET transaction_type = 'payment' WHERE transaction_type IS NULL")
    op.execute(
        """
        UPDATE payment_transactions pt
        SET provider_name = pi.provider_name
        FROM payment_intents pi
        WHERE pt.payment_intent_id = pi.id
          AND pt.provider_name IS NULL
        """
    )
    op.execute(
        """
        UPDATE payment_transactions
        SET raw_provider_payload = transaction_metadata
        WHERE raw_provider_payload IS NULL
          AND transaction_metadata IS NOT NULL
        """
    )

    op.alter_column("payment_transactions", "order_id", nullable=False)
    op.alter_column("payment_transactions", "transaction_type", nullable=False)

    inspector = sa.inspect(bind)
    if not _index_exists(inspector, "payment_transactions", "ix_payment_transactions_order_id"):
        op.create_index("ix_payment_transactions_order_id", "payment_transactions", ["order_id"], unique=False)


def downgrade() -> None:
    pass
