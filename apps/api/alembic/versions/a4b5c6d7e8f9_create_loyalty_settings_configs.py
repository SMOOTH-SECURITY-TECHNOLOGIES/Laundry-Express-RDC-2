"""create loyalty settings configs

Revision ID: a4b5c6d7e8f9
Revises: f3a4b5c6d7e8
Create Date: 2026-03-19 16:05:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "a4b5c6d7e8f9"
down_revision = "f3a4b5c6d7e8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("loyalty_settings_configs"):
        return

    op.create_table(
        "loyalty_settings_configs",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("points_per_dollar", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("points_to_dollar", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_loyalty_settings_configs_key"),
        "loyalty_settings_configs",
        ["key"],
        unique=True,
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("loyalty_settings_configs"):
        return

    op.drop_index(op.f("ix_loyalty_settings_configs_key"), table_name="loyalty_settings_configs")
    op.drop_table("loyalty_settings_configs")
