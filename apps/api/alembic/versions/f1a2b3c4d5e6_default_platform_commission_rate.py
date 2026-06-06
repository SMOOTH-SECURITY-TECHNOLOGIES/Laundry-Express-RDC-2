"""default_platform_commission_rate

Revision ID: f1a2b3c4d5e6
Revises: e4f5a6b7c8d9
Create Date: 2026-03-19 12:16:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f1a2b3c4d5e6"
down_revision = "e4f5a6b7c8d9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "commission_records",
        "platform_commission_rate",
        existing_type=sa.Float(),
        server_default=sa.text("0.0"),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "commission_records",
        "platform_commission_rate",
        existing_type=sa.Float(),
        server_default=None,
        existing_nullable=False,
    )
