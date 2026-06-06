"""add loyalty expiry policy fields

Revision ID: a5b6c7d8e9f0
Revises: f4b5c6d7e8f9
Create Date: 2026-03-19 18:55:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a5b6c7d8e9f0"
down_revision: Union[str, Sequence[str], None] = "f4b5c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return column_name in {column["name"] for column in inspector.get_columns(table_name)}


def _index_exists(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return index_name in {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "loyalty_settings_configs" in tables and not _column_exists(
        inspector, "loyalty_settings_configs", "points_expiry_days"
    ):
        op.add_column(
            "loyalty_settings_configs",
            sa.Column("points_expiry_days", sa.Integer(), nullable=True),
        )

    if "loyalty_ledger_entries" in tables:
        if not _column_exists(inspector, "loyalty_ledger_entries", "expires_at"):
            op.add_column(
                "loyalty_ledger_entries",
                sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            )
        if not _column_exists(inspector, "loyalty_ledger_entries", "expired_at"):
            op.add_column(
                "loyalty_ledger_entries",
                sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True),
            )
        inspector = sa.inspect(bind)
        if not _index_exists(inspector, "loyalty_ledger_entries", "ix_loyalty_ledger_entries_expires_at"):
            op.create_index(
                "ix_loyalty_ledger_entries_expires_at",
                "loyalty_ledger_entries",
                ["expires_at"],
                unique=False,
            )
        if not _index_exists(inspector, "loyalty_ledger_entries", "ix_loyalty_ledger_entries_expired_at"):
            op.create_index(
                "ix_loyalty_ledger_entries_expired_at",
                "loyalty_ledger_entries",
                ["expired_at"],
                unique=False,
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "loyalty_ledger_entries" in tables:
        if _index_exists(inspector, "loyalty_ledger_entries", "ix_loyalty_ledger_entries_expired_at"):
            op.drop_index("ix_loyalty_ledger_entries_expired_at", table_name="loyalty_ledger_entries")
        if _index_exists(inspector, "loyalty_ledger_entries", "ix_loyalty_ledger_entries_expires_at"):
            op.drop_index("ix_loyalty_ledger_entries_expires_at", table_name="loyalty_ledger_entries")
        inspector = sa.inspect(bind)
        if _column_exists(inspector, "loyalty_ledger_entries", "expired_at"):
            op.drop_column("loyalty_ledger_entries", "expired_at")
        if _column_exists(inspector, "loyalty_ledger_entries", "expires_at"):
            op.drop_column("loyalty_ledger_entries", "expires_at")

    if "loyalty_settings_configs" in tables and _column_exists(
        inspector, "loyalty_settings_configs", "points_expiry_days"
    ):
        op.drop_column("loyalty_settings_configs", "points_expiry_days")
