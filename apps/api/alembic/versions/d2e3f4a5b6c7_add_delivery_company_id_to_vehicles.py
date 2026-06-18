"""add delivery_company_id to vehicles

Revision ID: d2e3f4a5b6c7
Revises: b1c2d3e4f5a6
Create Date: 2026-06-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vehicles",
        sa.Column("delivery_company_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        op.f("ix_vehicles_delivery_company_id"),
        "vehicles",
        ["delivery_company_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_vehicles_delivery_company_id",
        "vehicles",
        "delivery_companies",
        ["delivery_company_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_vehicles_delivery_company_id", "vehicles", type_="foreignkey")
    op.drop_index(op.f("ix_vehicles_delivery_company_id"), table_name="vehicles")
    op.drop_column("vehicles", "delivery_company_id")
