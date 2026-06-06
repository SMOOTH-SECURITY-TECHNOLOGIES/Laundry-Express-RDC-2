"""create tracking settings configs

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-03-19 15:35:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e2f3a4b5c6d7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("tracking_settings_configs"):
        return

    op.create_table(
        "tracking_settings_configs",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("gtm_container_id", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("meta_pixel_id", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_tracking_settings_configs_key"),
        "tracking_settings_configs",
        ["key"],
        unique=True,
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("tracking_settings_configs"):
        return

    op.drop_index(op.f("ix_tracking_settings_configs_key"), table_name="tracking_settings_configs")
    op.drop_table("tracking_settings_configs")
