"""create integrations ops tables

Revision ID: t4u5v6w7x8y9
Revises: s3t4u5v6w7x8
Create Date: 2026-06-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "t4u5v6w7x8y9"
down_revision = "s3t4u5v6w7x8"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("integrations_api_keys", *_base(),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("key_hash", sa.String(128), nullable=False),
        sa.Column("key_type", sa.String(32), server_default="internal", nullable=False),
        sa.Column("scope", sa.String(255), server_default="orders.read", nullable=False),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
        sa.Column("created_by", sa.String(128), nullable=True),
        sa.Column("last_used_at", sa.String(64), nullable=True),
    )
    op.create_table("integrations_webhooks", *_base(),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("url", sa.String(512), nullable=False),
        sa.Column("event", sa.String(64), nullable=False),
        sa.Column("secret", sa.String(128), nullable=True),
        sa.Column("active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("success_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("failure_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_call_at", sa.String(64), nullable=True),
    )
    op.create_table("integrations_webhook_deliveries", *_base(),
        sa.Column("webhook_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("headers", postgresql.JSONB(), nullable=True),
        sa.Column("signature", sa.String(255), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), server_default="success", nullable=False),
        sa.Column("duration_ms", sa.Integer(), server_default="0", nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="1", nullable=False),
    )
    op.create_index("ix_integrations_webhook_deliveries_webhook_id", "integrations_webhook_deliveries", ["webhook_id"])
    op.create_table("integrations_tracking_configs", *_base(),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("config_json", postgresql.JSONB(), nullable=True),
        sa.Column("enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("health_status", sa.String(32), server_default="healthy", nullable=False),
    )
    op.create_index("ix_integrations_tracking_configs_provider", "integrations_tracking_configs", ["provider"], unique=True)
    op.create_table("integrations_health", *_base(),
        sa.Column("integration_name", sa.String(128), nullable=False),
        sa.Column("category", sa.String(64), server_default="other", nullable=False),
        sa.Column("status", sa.String(32), server_default="healthy", nullable=False),
        sa.Column("last_sync_at", sa.String(64), nullable=True),
        sa.Column("response_time_ms", sa.Integer(), server_default="0", nullable=False),
        sa.Column("uptime_pct", sa.Float(), server_default="99", nullable=False),
    )
    op.create_table("integrations_api_logs", *_base(),
        sa.Column("source", sa.String(64), nullable=False),
        sa.Column("endpoint", sa.String(255), nullable=False),
        sa.Column("log_type", sa.String(32), server_default="api", nullable=False),
        sa.Column("user_name", sa.String(128), nullable=True),
        sa.Column("integration_name", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), server_default="success", nullable=False),
        sa.Column("response_time_ms", sa.Integer(), server_default="0", nullable=False),
        sa.Column("occurred_at", sa.String(64), nullable=True),
    )
    op.create_table("integrations_alerts", *_base(),
        sa.Column("alert_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(32), server_default="medium", nullable=False),
        sa.Column("count", sa.Integer(), server_default="1", nullable=False),
    )


def downgrade() -> None:
    op.drop_table("integrations_alerts")
    op.drop_table("integrations_api_logs")
    op.drop_table("integrations_health")
    op.drop_index("ix_integrations_tracking_configs_provider", table_name="integrations_tracking_configs")
    op.drop_table("integrations_tracking_configs")
    op.drop_index("ix_integrations_webhook_deliveries_webhook_id", table_name="integrations_webhook_deliveries")
    op.drop_table("integrations_webhook_deliveries")
    op.drop_table("integrations_webhooks")
    op.drop_table("integrations_api_keys")
