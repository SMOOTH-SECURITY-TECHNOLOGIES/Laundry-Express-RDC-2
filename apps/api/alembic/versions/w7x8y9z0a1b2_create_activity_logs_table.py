"""create activity logs table

Revision ID: w7x8y9z0a1b2
Revises: v6w7x8y9z0a1
Create Date: 2026-06-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "w7x8y9z0a1b2"
down_revision = "v6w7x8y9z0a1"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("activity_logs", *_base(),
        sa.Column("event_id", sa.String(32), nullable=False),
        sa.Column("occurred_at", sa.String(64), nullable=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("actor_type", sa.String(32), server_default="admin", nullable=False),
        sa.Column("actor_name", sa.String(128), nullable=False),
        sa.Column("actor_role", sa.String(64), nullable=True),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("action_label", sa.String(128), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("resource_type", sa.String(64), nullable=False),
        sa.Column("resource_id", sa.String(64), nullable=True),
        sa.Column("reference", sa.String(64), nullable=True),
        sa.Column("corridor", sa.String(32), server_default="platform", nullable=False),
        sa.Column("severity", sa.String(32), server_default="info", nullable=False),
        sa.Column("status", sa.String(32), server_default="success", nullable=False),
        sa.Column("impact", sa.String(64), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("device", sa.String(128), nullable=True),
        sa.Column("browser", sa.String(128), nullable=True),
        sa.Column("os_name", sa.String(64), nullable=True),
        sa.Column("before_state", postgresql.JSONB(), nullable=True),
        sa.Column("after_state", postgresql.JSONB(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("corridors_impacted", postgresql.JSONB(), nullable=True),
        sa.Column("tenant_id", sa.String(64), nullable=True),
        sa.Column("is_anomaly", sa.Boolean(), server_default="false", nullable=False),
    )
    op.create_index("ix_activity_logs_event_id", "activity_logs", ["event_id"], unique=True)
    op.create_index("ix_activity_logs_occurred_at", "activity_logs", ["occurred_at"])
    op.create_index("ix_activity_logs_reference", "activity_logs", ["reference"])


def downgrade() -> None:
    op.drop_index("ix_activity_logs_reference", table_name="activity_logs")
    op.drop_index("ix_activity_logs_occurred_at", table_name="activity_logs")
    op.drop_index("ix_activity_logs_event_id", table_name="activity_logs")
    op.drop_table("activity_logs")
