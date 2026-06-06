"""align_commission_records_with_model

Revision ID: d3c4b5a6e7f8
Revises: a9d7e5c3b1f4
Create Date: 2026-03-19 12:05:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "d3c4b5a6e7f8"
down_revision = "a9d7e5c3b1f4"
branch_labels = None
depends_on = None


def _column_exists(connection, table_name: str, column_name: str) -> bool:
    result = connection.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = :table_name
                  AND column_name = :column_name
            )
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    )
    return bool(result.scalar())


def _fk_targets_users(connection) -> bool:
    result = connection.execute(
        text(
            """
            SELECT ccu.table_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema = tc.table_schema
            WHERE tc.table_name = 'commission_records'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'partner_id'
            LIMIT 1
            """
        )
    )
    return result.scalar() == "users"


def upgrade() -> None:
    connection = op.get_bind()

    if not _column_exists(connection, "commission_records", "discount_amount"):
        op.add_column(
            "commission_records",
            sa.Column("discount_amount", sa.Float(), nullable=True, server_default="0.0"),
        )
    op.execute(text("UPDATE commission_records SET discount_amount = 0.0 WHERE discount_amount IS NULL"))
    op.alter_column("commission_records", "discount_amount", server_default=None, nullable=False)

    if not _column_exists(connection, "commission_records", "net_paid_amount"):
        op.add_column(
            "commission_records",
            sa.Column("net_paid_amount", sa.Float(), nullable=True),
        )
    op.execute(
        text(
            """
            UPDATE commission_records
            SET net_paid_amount = COALESCE(net_paid_amount, partner_net_amount + platform_commission_amount)
            WHERE net_paid_amount IS NULL
            """
        )
    )
    op.alter_column("commission_records", "net_paid_amount", nullable=False)

    if not _column_exists(connection, "commission_records", "currency"):
        op.add_column(
            "commission_records",
            sa.Column("currency", sa.String(length=3), nullable=True, server_default="CDF"),
        )
    op.execute(text("UPDATE commission_records SET currency = 'CDF' WHERE currency IS NULL"))
    op.alter_column("commission_records", "currency", server_default=None, nullable=False)

    if not _column_exists(connection, "commission_records", "notes"):
        op.add_column(
            "commission_records",
            sa.Column("notes", sa.Text(), nullable=True),
        )
    if _column_exists(connection, "commission_records", "settlement_notes"):
        op.execute(
            text(
                """
                UPDATE commission_records
                SET notes = settlement_notes
                WHERE notes IS NULL AND settlement_notes IS NOT NULL
                """
            )
        )

    if _fk_targets_users(connection):
        op.drop_constraint(
            "commission_records_partner_id_fkey",
            "commission_records",
            type_="foreignkey",
        )
        op.create_foreign_key(
            "commission_records_partner_id_fkey",
            "commission_records",
            "partners",
            ["partner_id"],
            ["id"],
        )


def downgrade() -> None:
    connection = op.get_bind()

    if not _fk_targets_users(connection):
        op.drop_constraint(
            "commission_records_partner_id_fkey",
            "commission_records",
            type_="foreignkey",
        )
        op.create_foreign_key(
            "commission_records_partner_id_fkey",
            "commission_records",
            "users",
            ["partner_id"],
            ["id"],
        )

    if _column_exists(connection, "commission_records", "notes"):
        op.drop_column("commission_records", "notes")
    if _column_exists(connection, "commission_records", "currency"):
        op.drop_column("commission_records", "currency")
    if _column_exists(connection, "commission_records", "net_paid_amount"):
        op.drop_column("commission_records", "net_paid_amount")
    if _column_exists(connection, "commission_records", "discount_amount"):
        op.drop_column("commission_records", "discount_amount")
