"""create email ops tables

Revision ID: s3t4u5v6w7x8
Revises: r2s3t4u5v6w7
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "s3t4u5v6w7x8"
down_revision = "r2s3t4u5v6w7"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("email_templates", *_base(),
        sa.Column("name", sa.String(128), nullable=False), sa.Column("template_type", sa.String(32), server_default="transactional", nullable=False),
        sa.Column("language", sa.String(16), server_default="fr", nullable=False), sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("preheader", sa.String(255), nullable=True), sa.Column("body_html", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), server_default="active", nullable=False), sa.Column("usage_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("open_rate", sa.Float(), server_default="0", nullable=False), sa.Column("click_rate", sa.Float(), server_default="0", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
    )
    op.create_table("email_campaigns", *_base(),
        sa.Column("name", sa.String(128), nullable=False), sa.Column("audience", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), server_default="draft", nullable=False), sa.Column("sent_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("opened_count", sa.Integer(), server_default="0", nullable=False), sa.Column("clicked_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("conversions", sa.Integer(), server_default="0", nullable=False), sa.Column("revenue", sa.Float(), server_default="0", nullable=False),
        sa.Column("roi", sa.Float(), server_default="0", nullable=False), sa.Column("scheduled_at", sa.String(64), nullable=True),
    )
    op.create_table("email_automations", *_base(),
        sa.Column("name", sa.String(128), nullable=False), sa.Column("trigger_key", sa.String(64), nullable=False),
        sa.Column("template_name", sa.String(128), nullable=True), sa.Column("status", sa.String(32), server_default="active", nullable=False),
        sa.Column("last_run_at", sa.String(64), nullable=True), sa.Column("volume_30d", sa.Integer(), server_default="0", nullable=False),
        sa.Column("open_rate", sa.Float(), server_default="0", nullable=False), sa.Column("click_rate", sa.Float(), server_default="0", nullable=False),
    )
    op.create_table("email_messages", *_base(),
        sa.Column("reference", sa.String(64), nullable=False), sa.Column("recipient_email", sa.String(255), nullable=False),
        sa.Column("recipient_name", sa.String(128), nullable=True), sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("message_type", sa.String(32), server_default="transactional", nullable=False), sa.Column("template_name", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), server_default="sent", nullable=False), sa.Column("open_rate", sa.Float(), nullable=True),
        sa.Column("click_rate", sa.Float(), nullable=True), sa.Column("provider_message_id", sa.String(128), nullable=True),
        sa.Column("domain", sa.String(128), nullable=True), sa.Column("sent_at", sa.String(64), nullable=True),
    )
    op.create_index("ix_email_messages_reference", "email_messages", ["reference"], unique=True)
    op.create_table("email_bounces", *_base(),
        sa.Column("email", sa.String(255), nullable=False), sa.Column("bounce_type", sa.String(32), nullable=False),
        sa.Column("reason", sa.String(255), nullable=True), sa.Column("provider_code", sa.String(64), nullable=True),
        sa.Column("occurred_at", sa.String(64), nullable=True),
    )
    op.create_table("email_unsubscribes", *_base(),
        sa.Column("email", sa.String(255), nullable=False), sa.Column("unsubscribe_type", sa.String(32), server_default="marketing", nullable=False),
        sa.Column("reason", sa.String(255), nullable=True), sa.Column("consent_audit", postgresql.JSONB(), nullable=True),
    )
    op.create_table("email_invoice_logs", *_base(),
        sa.Column("invoice_ref", sa.String(64), nullable=False), sa.Column("recipient_email", sa.String(255), nullable=False),
        sa.Column("status", sa.String(32), server_default="sent", nullable=False), sa.Column("opened", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("downloaded", sa.Boolean(), server_default="false", nullable=False), sa.Column("reminder_count", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_table("email_deliverability", *_base(),
        sa.Column("domain", sa.String(128), nullable=False), sa.Column("health_status", sa.String(32), server_default="healthy", nullable=False),
        sa.Column("spf", sa.String(32), server_default="pass", nullable=False), sa.Column("dkim", sa.String(32), server_default="pass", nullable=False),
        sa.Column("dmarc", sa.String(32), server_default="pass", nullable=False), sa.Column("bounce_rate", sa.Float(), server_default="0", nullable=False),
        sa.Column("spam_complaints", sa.Float(), server_default="0", nullable=False), sa.Column("reputation_score", sa.Float(), server_default="95", nullable=False),
        sa.Column("delivery_rate", sa.Float(), server_default="99", nullable=False), sa.Column("open_rate", sa.Float(), server_default="0", nullable=False),
        sa.Column("click_rate", sa.Float(), server_default="0", nullable=False),
    )
    op.create_index("ix_email_deliverability_domain", "email_deliverability", ["domain"], unique=True)
    op.create_table("email_webhooks", *_base(),
        sa.Column("endpoint", sa.String(512), nullable=False), sa.Column("secret_masked", sa.String(64), nullable=True),
        sa.Column("last_call_at", sa.String(64), nullable=True), sa.Column("success_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_count", sa.Integer(), server_default="0", nullable=False), sa.Column("events", postgresql.JSONB(), nullable=True),
    )
    op.create_table("email_alerts", *_base(),
        sa.Column("alert_type", sa.String(64), nullable=False), sa.Column("title", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(32), server_default="medium", nullable=False), sa.Column("count", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_table("email_settings", *_base(),
        sa.Column("key", sa.String(64), nullable=False), sa.Column("value_json", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_email_settings_key", "email_settings", ["key"], unique=True)


def downgrade() -> None:
    for t in ("email_settings", "email_alerts", "email_webhooks", "email_deliverability", "email_invoice_logs",
              "email_unsubscribes", "email_bounces", "email_messages", "email_automations", "email_campaigns", "email_templates"):
        op.drop_table(t)
