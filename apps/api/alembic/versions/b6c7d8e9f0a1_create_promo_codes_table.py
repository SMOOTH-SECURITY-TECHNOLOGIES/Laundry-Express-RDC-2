"""create_promo_codes_table

Revision ID: b6c7d8e9f0a1
Revises: f1a2b3c4d5e6
Create Date: 2026-03-19 15:05:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "b6c7d8e9f0a1"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("promo_codes"):
        return

    op.create_table(
        "promo_codes",
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("discount_type", sa.String(length=20), nullable=False, server_default="percentage"),
        sa.Column("discount_value", sa.Numeric(10, 2), nullable=False),
        sa.Column("min_order_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_for_new_users_only", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("partner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("partners.id"), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("usage_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_usage", sa.Integer(), nullable=True),
        sa.Column("usage_limit_per_customer", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.String(length=20), nullable=True),
        sa.Column("end_date", sa.String(length=20), nullable=True),
        sa.Column("applicable_services", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("geographic_restrictions", sa.Text(), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_promo_codes_code"), "promo_codes", ["code"], unique=True)
    op.create_index(op.f("ix_promo_codes_partner_id"), "promo_codes", ["partner_id"], unique=False)
    op.create_index(op.f("ix_promo_codes_created_by_user_id"), "promo_codes", ["created_by_user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("promo_codes"):
        return

    op.drop_index(op.f("ix_promo_codes_created_by_user_id"), table_name="promo_codes")
    op.drop_index(op.f("ix_promo_codes_partner_id"), table_name="promo_codes")
    op.drop_index(op.f("ix_promo_codes_code"), table_name="promo_codes")
    op.drop_table("promo_codes")
