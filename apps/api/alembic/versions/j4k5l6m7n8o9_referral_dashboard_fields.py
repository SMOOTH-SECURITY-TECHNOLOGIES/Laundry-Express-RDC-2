"""referral dashboard fields

Revision ID: j4k5l6m7n8o9
Revises: i3j4k5l6m7n8
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "j4k5l6m7n8o9"
down_revision = "i3j4k5l6m7n8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("referral_settings_configs", sa.Column("referee_bonus_points", sa.Integer(), server_default="100", nullable=False))
    op.add_column("referral_settings_configs", sa.Column("points_expiry_days", sa.Integer(), nullable=True))
    op.add_column("referral_settings_configs", sa.Column("bonus_cap_per_referrer", sa.Integer(), nullable=True))
    op.add_column("referral_settings_configs", sa.Column("allowed_channels", sa.Text(), server_default="whatsapp,email,sms,link", nullable=True))

    op.create_table(
        "referral_campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("audience", sa.String(255), nullable=True),
        sa.Column("budget", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("start_date", sa.String(32), nullable=True),
        sa.Column("end_date", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("referral_campaigns")
    op.drop_column("referral_settings_configs", "allowed_channels")
    op.drop_column("referral_settings_configs", "bonus_cap_per_referrer")
    op.drop_column("referral_settings_configs", "points_expiry_days")
    op.drop_column("referral_settings_configs", "referee_bonus_points")
