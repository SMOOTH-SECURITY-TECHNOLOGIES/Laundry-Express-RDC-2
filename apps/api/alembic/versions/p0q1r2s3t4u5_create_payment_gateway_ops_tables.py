"""create payment gateway ops tables

Revision ID: p0q1r2s3t4u5
Revises: o9p0q1r2s3t4
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "p0q1r2s3t4u5"
down_revision = "o9p0q1r2s3t4"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("payment_gateway_providers", *_base(), sa.Column("slug", sa.String(64), nullable=False), sa.Column("name", sa.String(128), nullable=False), sa.Column("channel", sa.String(64), nullable=False), sa.Column("logo_key", sa.String(64), nullable=True), sa.Column("status", sa.String(32), server_default="online", nullable=False), sa.Column("volume", sa.Integer(), server_default="0", nullable=False), sa.Column("revenue", sa.Float(), server_default="0", nullable=False), sa.Column("commission", sa.Float(), server_default="0", nullable=False), sa.Column("success_rate", sa.Float(), server_default="99", nullable=False), sa.Column("last_incident_at", sa.DateTime(timezone=True), nullable=True), sa.Column("config", postgresql.JSONB(), nullable=True))
    op.create_index("ix_payment_gateway_providers_slug", "payment_gateway_providers", ["slug"], unique=True)

    op.create_table("payment_gateway_transactions", *_base(), sa.Column("reference", sa.String(64), nullable=False), sa.Column("client_name", sa.String(128), nullable=False), sa.Column("gateway_slug", sa.String(64), nullable=False), sa.Column("amount", sa.Float(), nullable=False), sa.Column("currency", sa.String(8), server_default="USD", nullable=False), sa.Column("status", sa.String(32), server_default="success", nullable=False), sa.Column("channel", sa.String(64), nullable=True), sa.Column("partner_name", sa.String(128), nullable=True), sa.Column("metadata_json", postgresql.JSONB(), nullable=True))
    op.create_index("ix_payment_gateway_transactions_reference", "payment_gateway_transactions", ["reference"], unique=True)

    op.create_table("payment_gateway_incidents", *_base(), sa.Column("incident_type", sa.String(64), nullable=False), sa.Column("title", sa.String(255), nullable=False), sa.Column("severity", sa.String(32), server_default="medium", nullable=False), sa.Column("gateway_slug", sa.String(64), nullable=True), sa.Column("impact", sa.String(255), nullable=True), sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=True), sa.Column("resolved", sa.Boolean(), server_default="false", nullable=False))

    op.create_table("payment_gateway_settlements", *_base(), sa.Column("gateway_slug", sa.String(64), nullable=False), sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True), sa.Column("amount", sa.Float(), nullable=False), sa.Column("status", sa.String(32), server_default="scheduled", nullable=False))

    op.create_table("payment_gateway_webhooks", *_base(), sa.Column("gateway_slug", sa.String(64), nullable=False), sa.Column("endpoint", sa.String(512), nullable=False), sa.Column("last_call_at", sa.DateTime(timezone=True), nullable=True), sa.Column("success_count", sa.Integer(), server_default="0", nullable=False), sa.Column("error_count", sa.Integer(), server_default="0", nullable=False), sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False), sa.Column("events", postgresql.JSONB(), nullable=True))

    op.create_table("payment_gateway_reconciliations", *_base(), sa.Column("reference", sa.String(64), nullable=False), sa.Column("provider_amount", sa.Float(), nullable=True), sa.Column("internal_amount", sa.Float(), nullable=True), sa.Column("status", sa.String(32), server_default="match", nullable=False), sa.Column("gateway_slug", sa.String(64), nullable=True))

    op.create_table("payment_gateway_health", *_base(), sa.Column("gateway_slug", sa.String(64), nullable=False), sa.Column("uptime", sa.Float(), server_default="99.9", nullable=False), sa.Column("latency_ms", sa.Integer(), server_default="200", nullable=False), sa.Column("error_rate", sa.Float(), server_default="0.1", nullable=False), sa.Column("success_rate", sa.Float(), server_default="99", nullable=False), sa.Column("status", sa.String(32), server_default="healthy", nullable=False))
    op.create_index("ix_payment_gateway_health_slug", "payment_gateway_health", ["gateway_slug"], unique=True)

    op.create_table("payment_gateway_refunds", *_base(), sa.Column("client_name", sa.String(128), nullable=False), sa.Column("amount", sa.Float(), nullable=False), sa.Column("reason", sa.String(255), nullable=True), sa.Column("status", sa.String(32), server_default="pending", nullable=False), sa.Column("gateway_slug", sa.String(64), nullable=True))

    op.create_table("payment_gateway_cash_flows", *_base(), sa.Column("period", sa.String(16), nullable=False), sa.Column("cash_received", sa.Float(), server_default="0", nullable=False), sa.Column("cash_withdrawn", sa.Float(), server_default="0", nullable=False), sa.Column("cash_in_transit", sa.Float(), server_default="0", nullable=False), sa.Column("cash_net", sa.Float(), server_default="0", nullable=False), sa.Column("data_points", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    for t in ("payment_gateway_cash_flows", "payment_gateway_refunds", "payment_gateway_health", "payment_gateway_reconciliations", "payment_gateway_webhooks", "payment_gateway_settlements", "payment_gateway_incidents", "payment_gateway_transactions", "payment_gateway_providers"):
        op.drop_table(t)
