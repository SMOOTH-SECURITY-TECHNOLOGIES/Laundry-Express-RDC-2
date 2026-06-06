"""add loyalty points to users

Revision ID: c6d7e8f9a0b1
Revises: b5c6d7e8f9a0
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "c6d7e8f9a0b1"
down_revision = "b5c6d7e8f9a0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "loyalty_points" not in columns:
        op.add_column(
            "users",
            sa.Column("loyalty_points", sa.Integer(), nullable=False, server_default="0"),
        )
        op.execute("UPDATE users SET loyalty_points = 0 WHERE loyalty_points IS NULL")
        op.alter_column("users", "loyalty_points", server_default=None)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "loyalty_points" in columns:
        op.drop_column("users", "loyalty_points")
