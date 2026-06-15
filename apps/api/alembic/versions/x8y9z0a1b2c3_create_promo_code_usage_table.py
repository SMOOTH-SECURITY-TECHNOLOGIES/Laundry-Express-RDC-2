"""create promo code usage ledger table

Revision ID: x8y9z0a1b2c3
Revises: w7x8y9z0a1b2
Create Date: 2026-06-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "x8y9z0a1b2c3"
down_revision = "w7x8y9z0a1b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "promo_code_usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("promo_code_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("promo_codes.id"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("discount_applied", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_promo_code_usage_promo_code_id", "promo_code_usage", ["promo_code_id"])
    op.create_index("ix_promo_code_usage_order_id", "promo_code_usage", ["order_id"], unique=True)
    op.create_index("ix_promo_code_usage_customer_id", "promo_code_usage", ["customer_id"])


def downgrade() -> None:
    op.drop_index("ix_promo_code_usage_customer_id", table_name="promo_code_usage")
    op.drop_index("ix_promo_code_usage_order_id", table_name="promo_code_usage")
    op.drop_index("ix_promo_code_usage_promo_code_id", table_name="promo_code_usage")
    op.drop_table("promo_code_usage")
