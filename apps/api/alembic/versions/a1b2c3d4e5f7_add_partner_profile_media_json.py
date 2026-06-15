"""Add partner profile media JSON column

Revision ID: a1b2c3d4e5f7
Revises: z9a0b1c2d3e4
Create Date: 2026-06-12 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = "a1b2c3d4e5f7"
down_revision = "z9a0b1c2d3e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("partners", sa.Column("profile_media_json", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("partners", "profile_media_json")
