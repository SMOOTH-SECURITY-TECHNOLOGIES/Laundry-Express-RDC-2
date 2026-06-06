"""add timestamp defaults to refund tables

Revision ID: a9d7e5c3b1f4
Revises: f7b3c1d2e4a5
Create Date: 2026-03-18 21:33:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "a9d7e5c3b1f4"
down_revision = "f7b3c1d2e4a5"
branch_labels = None
depends_on = None


def _set_defaults(table_name: str) -> None:
    op.alter_column(
        table_name,
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )
    op.alter_column(
        table_name,
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )


def _drop_defaults(table_name: str) -> None:
    op.alter_column(
        table_name,
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        table_name,
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )


def upgrade() -> None:
    _set_defaults("refund_requests")
    _set_defaults("refund_transactions")


def downgrade() -> None:
    _drop_defaults("refund_transactions")
    _drop_defaults("refund_requests")
