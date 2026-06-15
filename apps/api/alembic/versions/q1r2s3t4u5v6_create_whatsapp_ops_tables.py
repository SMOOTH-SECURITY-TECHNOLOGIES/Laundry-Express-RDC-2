"""create whatsapp ops tables

Revision ID: q1r2s3t4u5v6
Revises: p0q1r2s3t4u5
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "q1r2s3t4u5v6"
down_revision = "p0q1r2s3t4u5"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("whatsapp_conversations", *_base(),
        sa.Column("client_name", sa.String(128), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False),
        sa.Column("last_message", sa.Text(), nullable=True),
        sa.Column("channel", sa.String(32), server_default="whatsapp", nullable=False),
        sa.Column("assigned_to", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), server_default="open", nullable=False),
        sa.Column("wait_time_sec", sa.Integer(), server_default="0", nullable=False),
        sa.Column("messages_json", postgresql.JSONB(), nullable=True),
        sa.Column("linked_orders", postgresql.JSONB(), nullable=True),
        sa.Column("linked_tickets", postgresql.JSONB(), nullable=True),
        sa.Column("internal_notes", postgresql.JSONB(), nullable=True),
        sa.Column("ai_suggestions", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_whatsapp_conversations_phone", "whatsapp_conversations", ["phone"])

    op.create_table("whatsapp_templates", *_base(),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("category", sa.String(32), server_default="utility", nullable=False),
        sa.Column("language", sa.String(16), server_default="fr", nullable=False),
        sa.Column("meta_status", sa.String(32), server_default="approved", nullable=False),
        sa.Column("usage_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("delivery_rate", sa.Float(), server_default="95", nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("components_json", postgresql.JSONB(), nullable=True),
    )

    op.create_table("whatsapp_campaigns", *_base(),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("campaign_type", sa.String(32), server_default="broadcast", nullable=False),
        sa.Column("template_name", sa.String(128), nullable=True),
        sa.Column("audience", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
        sa.Column("sent", sa.Integer(), server_default="0", nullable=False),
        sa.Column("delivered", sa.Integer(), server_default="0", nullable=False),
        sa.Column("opened", sa.Integer(), server_default="0", nullable=False),
        sa.Column("replies", sa.Integer(), server_default="0", nullable=False),
        sa.Column("clicks", sa.Integer(), server_default="0", nullable=False),
        sa.Column("conversions", sa.Integer(), server_default="0", nullable=False),
    )

    op.create_table("whatsapp_automations", *_base(),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("trigger_type", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
        sa.Column("nodes_json", postgresql.JSONB(), nullable=True),
        sa.Column("runs_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("success_rate", sa.Float(), server_default="90", nullable=False),
    )

    op.create_table("whatsapp_notifications", *_base(),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("template_name", sa.String(128), nullable=True),
        sa.Column("recipient", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), server_default="delivered", nullable=False),
        sa.Column("channel", sa.String(32), server_default="whatsapp", nullable=False),
    )

    op.create_table("whatsapp_webhooks", *_base(),
        sa.Column("endpoint", sa.String(512), nullable=False),
        sa.Column("secret_masked", sa.String(64), nullable=True),
        sa.Column("last_call_at", sa.String(64), nullable=True),
        sa.Column("success_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("events", postgresql.JSONB(), nullable=True),
    )

    op.create_table("whatsapp_quality", *_base(),
        sa.Column("quality_rating", sa.String(32), server_default="high", nullable=False),
        sa.Column("messaging_limit", sa.String(64), server_default="1000/jour", nullable=False),
        sa.Column("phone_status", sa.String(32), server_default="connected", nullable=False),
        sa.Column("verification_status", sa.String(32), server_default="verified", nullable=False),
        sa.Column("alerts_json", postgresql.JSONB(), nullable=True),
    )

    op.create_table("whatsapp_cost_snapshots", *_base(),
        sa.Column("period", sa.String(16), server_default="current", nullable=False),
        sa.Column("total_today", sa.Float(), server_default="0", nullable=False),
        sa.Column("total_week", sa.Float(), server_default="0", nullable=False),
        sa.Column("total_month", sa.Float(), server_default="0", nullable=False),
        sa.Column("marketing_cost", sa.Float(), server_default="0", nullable=False),
        sa.Column("utility_cost", sa.Float(), server_default="0", nullable=False),
        sa.Column("auth_cost", sa.Float(), server_default="0", nullable=False),
        sa.Column("cost_per_conversation", sa.Float(), server_default="0", nullable=False),
        sa.Column("trend", sa.Float(), server_default="0", nullable=False),
        sa.Column("forecast", sa.Float(), server_default="0", nullable=False),
        sa.Column("data_points", postgresql.JSONB(), nullable=True),
    )

    op.create_table("whatsapp_ai_metrics", *_base(),
        sa.Column("ai_conversations_pct", sa.Float(), server_default="72", nullable=False),
        sa.Column("human_escalations", sa.Integer(), server_default="0", nullable=False),
        sa.Column("ai_confidence", sa.Float(), server_default="87", nullable=False),
        sa.Column("resolution_rate", sa.Float(), server_default="68", nullable=False),
        sa.Column("resolved_without_human", sa.Integer(), server_default="0", nullable=False),
        sa.Column("cost_saved", sa.Float(), server_default="0", nullable=False),
        sa.Column("satisfaction", sa.Float(), server_default="4.6", nullable=False),
        sa.Column("prompts_json", postgresql.JSONB(), nullable=True),
    )

    op.create_table("whatsapp_segments", *_base(),
        sa.Column("slug", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("size", sa.Integer(), server_default="0", nullable=False),
        sa.Column("engagement", sa.Float(), server_default="0", nullable=False),
        sa.Column("conversion", sa.Float(), server_default="0", nullable=False),
    )
    op.create_index("ix_whatsapp_segments_slug", "whatsapp_segments", ["slug"], unique=True)


def downgrade() -> None:
    for t in (
        "whatsapp_segments", "whatsapp_ai_metrics", "whatsapp_cost_snapshots",
        "whatsapp_quality", "whatsapp_webhooks", "whatsapp_notifications",
        "whatsapp_automations", "whatsapp_campaigns", "whatsapp_templates",
        "whatsapp_conversations",
    ):
        op.drop_table(t)
