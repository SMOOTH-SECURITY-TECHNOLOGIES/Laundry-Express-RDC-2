"""add delivery_company_id to users

Revision ID: b1c2d3e4f5a6
Revises: z9a0b1c2d3e4
Create Date: 2026-06-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("delivery_company_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        op.f("ix_users_delivery_company_id"),
        "users",
        ["delivery_company_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_users_delivery_company_id",
        "users",
        "delivery_companies",
        ["delivery_company_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_delivery_company_id", "users", type_="foreignkey")
    op.drop_index(op.f("ix_users_delivery_company_id"), table_name="users")
    op.drop_column("users", "delivery_company_id")
