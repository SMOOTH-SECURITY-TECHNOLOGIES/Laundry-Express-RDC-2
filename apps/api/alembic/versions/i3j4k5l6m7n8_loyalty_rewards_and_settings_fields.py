"""loyalty rewards and settings fields

Revision ID: i3j4k5l6m7n8
Revises: h2i3j4k5l6m7
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "i3j4k5l6m7n8"
down_revision = "h2i3j4k5l6m7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("loyalty_settings_configs", sa.Column("redemption_cap", sa.Integer(), nullable=True))
    op.add_column("loyalty_settings_configs", sa.Column("first_order_bonus", sa.Integer(), server_default="200", nullable=False))

    op.create_table(
        "loyalty_rewards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("points_required", sa.Integer(), nullable=False),
        sa.Column("value_dollars", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("loyalty_rewards")
    op.drop_column("loyalty_settings_configs", "first_order_bonus")
    op.drop_column("loyalty_settings_configs", "redemption_cap")
