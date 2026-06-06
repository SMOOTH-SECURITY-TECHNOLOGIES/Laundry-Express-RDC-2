"""add timestamp defaults to disputes

Revision ID: f7b3c1d2e4a5
Revises: e6a1b3d4f9c2
Create Date: 2026-03-18 21:27:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "f7b3c1d2e4a5"
down_revision = "e6a1b3d4f9c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "disputes",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )
    op.alter_column(
        "disputes",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "disputes",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        "disputes",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )
