"""create claims tables

Revision ID: l6m7n8o9p0q1
Revises: k5l6m7n8o9p0
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "l6m7n8o9p0q1"
down_revision = "k5l6m7n8o9p0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "claims",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("claim_number", sa.String(32), nullable=False, unique=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("partner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("partners.id"), nullable=True),
        sa.Column("driver_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("drivers.id"), nullable=True),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("priority", sa.String(16), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("risk_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("sla_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("zone", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_claims_claim_number", "claims", ["claim_number"])
    op.create_index("ix_claims_status", "claims", ["status"])
    op.create_index("ix_claims_priority", "claims", ["priority"])

    for tbl, extra in [
        ("claim_events", [sa.Column("claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=False),
                          sa.Column("event_type", sa.String(64), nullable=False),
                          sa.Column("old_status", sa.String(32)), sa.Column("new_status", sa.String(32)),
                          sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
                          sa.Column("payload", postgresql.JSONB())]),
        ("claim_notes", [sa.Column("claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=False),
                         sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
                         sa.Column("content", sa.Text(), nullable=False),
                         sa.Column("is_internal", sa.String(8), server_default="true")]),
        ("claim_attachments", [sa.Column("claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=False),
                               sa.Column("file_url", sa.String(512), nullable=False),
                               sa.Column("mime_type", sa.String(128)), sa.Column("size", sa.Integer()),
                               sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False)]),
        ("claim_escalations", [sa.Column("claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=False),
                                 sa.Column("reason", sa.String(255), nullable=False),
                                 sa.Column("escalated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
                                 sa.Column("severity", sa.String(16), server_default="high")]),
        ("claim_assignments", [sa.Column("claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=False),
                                 sa.Column("assignee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
                                 sa.Column("assigned_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"))]),
        ("claim_refunds", [sa.Column("claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=False),
                           sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id")),
                           sa.Column("requested_amount", sa.Float(), server_default="0"),
                           sa.Column("approved_amount", sa.Float()), sa.Column("currency", sa.String(8), server_default="USD"),
                           sa.Column("status", sa.String(16), server_default="pending"),
                           sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
                           sa.Column("paid_at", sa.DateTime(timezone=True))]),
        ("claim_status_history", [sa.Column("claim_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("claims.id"), nullable=False),
                                  sa.Column("old_status", sa.String(32)), sa.Column("new_status", sa.String(32), nullable=False),
                                  sa.Column("changed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"))]),
    ]:
        op.create_table(
            tbl,
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            *extra,
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )

    op.create_table(
        "claim_sla_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("claim_type", sa.String(32), unique=True, nullable=False),
        sa.Column("hours", sa.Integer(), nullable=False),
        sa.Column("at_risk_pct", sa.Float(), server_default="0.75"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "claim_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(32), unique=True, nullable=False),
        sa.Column("label", sa.String(128), nullable=False),
        sa.Column("color", sa.String(16)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    for tbl in ["claim_categories", "claim_sla_rules", "claim_status_history", "claim_refunds",
                "claim_assignments", "claim_escalations", "claim_attachments", "claim_notes", "claim_events", "claims"]:
        op.drop_table(tbl)
