"""add resolution_type to disputes

Revision ID: e6a1b3d4f9c2
Revises: c4f2a6b8d1e9
Create Date: 2026-03-18 21:22:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "e6a1b3d4f9c2"
down_revision = "c4f2a6b8d1e9"
branch_labels = None
depends_on = None


def _get_columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _get_columns("disputes")
    if "resolution_type" not in columns:
        op.add_column("disputes", sa.Column("resolution_type", sa.String(length=50), nullable=True))


def downgrade() -> None:
    columns = _get_columns("disputes")
    if "resolution_type" in columns:
        op.drop_column("disputes", "resolution_type")
