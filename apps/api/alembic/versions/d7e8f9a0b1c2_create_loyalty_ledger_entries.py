"""create loyalty ledger entries

Revision ID: d7e8f9a0b1c2
Revises: f9a0b1c2d3e4
Create Date: 2026-03-19 17:18:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, Sequence[str], None] = "f9a0b1c2d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "loyalty_ledger_entries" not in tables:
        op.create_table(
            "loyalty_ledger_entries",
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("entry_type", sa.String(length=50), nullable=False),
            sa.Column("points_delta", sa.Integer(), nullable=False),
            sa.Column("balance_after", sa.Integer(), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=False),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_loyalty_ledger_entries_user_id", "loyalty_ledger_entries", ["user_id"], unique=False)
        op.create_index("ix_loyalty_ledger_entries_order_id", "loyalty_ledger_entries", ["order_id"], unique=False)
        op.create_index("ix_loyalty_ledger_entries_entry_type", "loyalty_ledger_entries", ["entry_type"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "loyalty_ledger_entries" in tables:
        op.drop_index("ix_loyalty_ledger_entries_entry_type", table_name="loyalty_ledger_entries")
        op.drop_index("ix_loyalty_ledger_entries_order_id", table_name="loyalty_ledger_entries")
        op.drop_index("ix_loyalty_ledger_entries_user_id", table_name="loyalty_ledger_entries")
        op.drop_table("loyalty_ledger_entries")
