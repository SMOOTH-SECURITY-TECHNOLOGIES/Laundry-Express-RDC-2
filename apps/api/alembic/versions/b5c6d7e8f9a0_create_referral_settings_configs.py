"""create referral settings configs

Revision ID: b5c6d7e8f9a0
Revises: a4b5c6d7e8f9
Create Date: 2026-03-19 16:20:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "b5c6d7e8f9a0"
down_revision = "a4b5c6d7e8f9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("referral_settings_configs"):
        return

    op.create_table(
        "referral_settings_configs",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("referrer_bonus_points", sa.Integer(), nullable=False, server_default="500"),
        sa.Column("referee_discount_amount", sa.Numeric(10, 2), nullable=False, server_default="5"),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_referral_settings_configs_key"),
        "referral_settings_configs",
        ["key"],
        unique=True,
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("referral_settings_configs"):
        return

    op.drop_index(op.f("ix_referral_settings_configs_key"), table_name="referral_settings_configs")
    op.drop_table("referral_settings_configs")
