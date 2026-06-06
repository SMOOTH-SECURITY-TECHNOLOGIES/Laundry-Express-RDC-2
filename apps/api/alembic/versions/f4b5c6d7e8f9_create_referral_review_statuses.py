"""create referral review statuses

Revision ID: f4b5c6d7e8f9
Revises: e8f9a0b1c2d3
Create Date: 2026-03-19 18:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "f4b5c6d7e8f9"
down_revision = "e8f9a0b1c2d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("referral_review_statuses"):
        return

    op.create_table(
        "referral_review_statuses",
        sa.Column("referrer_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("review_status", sa.String(length=50), nullable=False, server_default="clear"),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_referral_review_statuses_referrer_user_id"), "referral_review_statuses", ["referrer_user_id"], unique=True)
    op.create_index(op.f("ix_referral_review_statuses_reviewed_by_user_id"), "referral_review_statuses", ["reviewed_by_user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("referral_review_statuses"):
        return

    op.drop_index(op.f("ix_referral_review_statuses_reviewed_by_user_id"), table_name="referral_review_statuses")
    op.drop_index(op.f("ix_referral_review_statuses_referrer_user_id"), table_name="referral_review_statuses")
    op.drop_table("referral_review_statuses")
