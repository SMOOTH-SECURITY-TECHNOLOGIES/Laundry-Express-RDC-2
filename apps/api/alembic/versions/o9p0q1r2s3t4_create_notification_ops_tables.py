"""create notification ops tables

Revision ID: o9p0q1r2s3t4
Revises: n8o9p0q1r2s3
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "o9p0q1r2s3t4"
down_revision = "n8o9p0q1r2s3"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("notification_ops_templates", *_base(), sa.Column("name", sa.String(128), nullable=False), sa.Column("channel", sa.String(32), nullable=False), sa.Column("event_type", sa.String(64), nullable=False), sa.Column("language", sa.String(16), server_default="fr", nullable=False), sa.Column("status", sa.String(32), server_default="active", nullable=False), sa.Column("subject", sa.String(255), nullable=True), sa.Column("body", sa.Text(), server_default="", nullable=False), sa.Column("variables", postgresql.JSONB(), nullable=True), sa.Column("translations", postgresql.JSONB(), nullable=True), sa.Column("usage_count", sa.Integer(), server_default="0", nullable=False), sa.Column("delivery_rate", sa.Float(), server_default="98", nullable=False), sa.Column("open_rate", sa.Float(), nullable=True), sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False))
    op.create_index("ix_notification_ops_templates_name", "notification_ops_templates", ["name"])

    op.create_table("notification_ops_items", *_base(), sa.Column("title", sa.String(255), nullable=False), sa.Column("message_preview", sa.String(512), nullable=True), sa.Column("channel", sa.String(32), nullable=False), sa.Column("event_type", sa.String(64), nullable=False), sa.Column("audience", sa.String(128), nullable=False), sa.Column("status", sa.String(32), server_default="delivered", nullable=False), sa.Column("delivery_rate", sa.Float(), server_default="100", nullable=False), sa.Column("open_rate", sa.Float(), nullable=True), sa.Column("click_rate", sa.Float(), nullable=True), sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True), sa.Column("partner_id", postgresql.UUID(as_uuid=True), nullable=True), sa.Column("zone", sa.String(64), nullable=True), sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("notification_ops_templates.id"), nullable=True), sa.Column("metadata_json", postgresql.JSONB(), nullable=True))
    op.create_index("ix_notification_ops_items_channel", "notification_ops_items", ["channel"])
    op.create_index("ix_notification_ops_items_event_type", "notification_ops_items", ["event_type"])

    op.create_table("notification_ops_automations", *_base(), sa.Column("name", sa.String(255), nullable=False), sa.Column("trigger_key", sa.String(128), nullable=False), sa.Column("channel", sa.String(32), nullable=False), sa.Column("status", sa.String(32), server_default="active", nullable=False), sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True), sa.Column("config", postgresql.JSONB(), nullable=True))

    op.create_table("notification_ops_segments", *_base(), sa.Column("name", sa.String(128), nullable=False), sa.Column("slug", sa.String(64), unique=True, nullable=False), sa.Column("size", sa.Integer(), server_default="0", nullable=False), sa.Column("rules", postgresql.JSONB(), nullable=True), sa.Column("preferred_channel", sa.String(32), nullable=True), sa.Column("engagement_rate", sa.Float(), server_default="0", nullable=False))

    op.create_table("notification_ops_errors", *_base(), sa.Column("channel", sa.String(32), nullable=False), sa.Column("provider", sa.String(64), nullable=False), sa.Column("error_code", sa.String(64), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("occurrences", sa.Integer(), server_default="1", nullable=False), sa.Column("last_occurrence_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table("notification_ops_unsubscribes", *_base(), sa.Column("channel", sa.String(32), nullable=False), sa.Column("user_email", sa.String(255), nullable=True), sa.Column("user_phone", sa.String(32), nullable=True), sa.Column("reason", sa.String(255), nullable=True), sa.Column("unsubscribed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table("notification_ops_provider_health", *_base(), sa.Column("channel", sa.String(32), unique=True, nullable=False), sa.Column("provider", sa.String(64), nullable=False), sa.Column("delivery_rate", sa.Float(), server_default="99", nullable=False), sa.Column("latency_ms", sa.Integer(), server_default="200", nullable=False), sa.Column("error_count", sa.Integer(), server_default="0", nullable=False), sa.Column("status", sa.String(32), server_default="healthy", nullable=False), sa.Column("last_incident_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table("notification_ops_activities", *_base(), sa.Column("activity_type", sa.String(64), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("actor_name", sa.String(128), nullable=True), sa.Column("metadata_json", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    for t in ("notification_ops_activities", "notification_ops_provider_health", "notification_ops_unsubscribes", "notification_ops_errors", "notification_ops_segments", "notification_ops_automations", "notification_ops_items", "notification_ops_templates"):
        op.drop_table(t)
