"""create sms ops tables

Revision ID: r2s3t4u5v6w7
Revises: q1r2s3t4u5v6
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "r2s3t4u5v6w7"
down_revision = "q1r2s3t4u5v6"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("sms_providers", *_base(),
        sa.Column("slug", sa.String(64), nullable=False), sa.Column("name", sa.String(128), nullable=False),
        sa.Column("provider_type", sa.String(32), nullable=False), sa.Column("active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("delivery_rate", sa.Float(), server_default="95", nullable=False), sa.Column("cost_per_sms", sa.Float(), server_default="0.021", nullable=False),
        sa.Column("avg_delivery_ms", sa.Integer(), server_default="3000", nullable=False),
    )
    op.create_index("ix_sms_providers_slug", "sms_providers", ["slug"], unique=True)

    op.create_table("sms_senders", *_base(),
        sa.Column("name", sa.String(64), nullable=False), sa.Column("sender_id", sa.String(32), nullable=False),
        sa.Column("approved", sa.Boolean(), server_default="false", nullable=False), sa.Column("active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("approval_status", sa.String(32), server_default="pending", nullable=False),
        sa.Column("volume", sa.Integer(), server_default="0", nullable=False), sa.Column("delivery_rate", sa.Float(), server_default="95", nullable=False),
    )
    op.create_index("ix_sms_senders_sender_id", "sms_senders", ["sender_id"], unique=True)

    op.create_table("sms_templates", *_base(),
        sa.Column("name", sa.String(128), nullable=False), sa.Column("category", sa.String(32), server_default="transaction", nullable=False),
        sa.Column("content", sa.Text(), nullable=False), sa.Column("active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("usage_count", sa.Integer(), server_default="0", nullable=False), sa.Column("delivery_rate", sa.Float(), server_default="95", nullable=False),
    )

    op.create_table("sms_campaigns", *_base(),
        sa.Column("name", sa.String(128), nullable=False), sa.Column("campaign_type", sa.String(32), server_default="marketing", nullable=False),
        sa.Column("status", sa.String(32), server_default="draft", nullable=False), sa.Column("message", sa.Text(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True), sa.Column("target_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("sent_count", sa.Integer(), server_default="0", nullable=False), sa.Column("delivered_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("failed_count", sa.Integer(), server_default="0", nullable=False), sa.Column("reply_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("audience", sa.String(128), nullable=True), sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.create_table("sms_messages", *_base(),
        sa.Column("reference", sa.String(64), nullable=False), sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=True), sa.Column("template_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=True), sa.Column("operator_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("operator_slug", sa.String(64), nullable=True), sa.Column("phone_number", sa.String(32), nullable=False),
        sa.Column("recipient_name", sa.String(128), nullable=True), sa.Column("message", sa.Text(), nullable=False),
        sa.Column("message_type", sa.String(32), server_default="transaction", nullable=False), sa.Column("status", sa.String(32), server_default="pending", nullable=False),
        sa.Column("provider_message_id", sa.String(128), nullable=True), sa.Column("cost", sa.Float(), server_default="0", nullable=False),
        sa.Column("sender_name", sa.String(64), nullable=True), sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sms_messages_reference", "sms_messages", ["reference"], unique=True)
    op.create_index("ix_sms_messages_phone", "sms_messages", ["phone_number"])

    op.create_table("sms_credit_ledger", *_base(),
        sa.Column("provider_id", postgresql.UUID(as_uuid=True), nullable=True), sa.Column("provider_slug", sa.String(64), nullable=True),
        sa.Column("movement_type", sa.String(32), nullable=False), sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False), sa.Column("note", sa.String(255), nullable=True),
    )

    op.create_table("sms_logs", *_base(),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), nullable=True), sa.Column("reference", sa.String(64), nullable=True),
        sa.Column("phone_number", sa.String(32), nullable=True), sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("request_json", postgresql.JSONB(), nullable=True), sa.Column("response_json", postgresql.JSONB(), nullable=True),
        sa.Column("provider_id", sa.String(128), nullable=True), sa.Column("status", sa.String(32), nullable=True),
    )
    op.create_index("ix_sms_logs_reference", "sms_logs", ["reference"])

    op.create_table("sms_otp_records", *_base(),
        sa.Column("phone_number", sa.String(32), nullable=False), sa.Column("code_masked", sa.String(16), nullable=False),
        sa.Column("status", sa.String(32), server_default="pending", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True), sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table("sms_alerts", *_base(),
        sa.Column("alert_type", sa.String(64), nullable=False), sa.Column("title", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(32), server_default="medium", nullable=False), sa.Column("count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("resolved", sa.Boolean(), server_default="false", nullable=False),
    )

    op.create_table("sms_webhooks", *_base(),
        sa.Column("endpoint", sa.String(512), nullable=False), sa.Column("secret_masked", sa.String(64), nullable=True),
        sa.Column("last_call_at", sa.DateTime(timezone=True), nullable=True), sa.Column("success_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_count", sa.Integer(), server_default="0", nullable=False), sa.Column("consecutive_errors", sa.Integer(), server_default="0", nullable=False),
    )

    op.create_table("sms_settings", *_base(),
        sa.Column("key", sa.String(64), nullable=False), sa.Column("value_json", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_sms_settings_key", "sms_settings", ["key"], unique=True)


def downgrade() -> None:
    for t in ("sms_settings", "sms_webhooks", "sms_alerts", "sms_otp_records", "sms_logs", "sms_credit_ledger",
              "sms_messages", "sms_campaigns", "sms_templates", "sms_senders", "sms_providers"):
        op.drop_table(t)
