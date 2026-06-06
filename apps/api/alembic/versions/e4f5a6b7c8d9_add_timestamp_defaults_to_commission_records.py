"""add_timestamp_defaults_to_commission_records

Revision ID: e4f5a6b7c8d9
Revises: d3c4b5a6e7f8
Create Date: 2026-03-19 12:12:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e4f5a6b7c8d9"
down_revision = "d3c4b5a6e7f8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "commission_records",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("CURRENT_TIMESTAMP"),
        existing_nullable=False,
    )
    op.alter_column(
        "commission_records",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("CURRENT_TIMESTAMP"),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "commission_records",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        "commission_records",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )
