"""add_timestamp_defaults_to_marketplace_tables

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-03-19 12:28:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a7b8c9d0e1f2"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


TABLES = [
    "delivery_companies",
    "company_drivers",
    "company_service_zones",
    "dispatch_settings",
]


def upgrade() -> None:
    for table_name in TABLES:
        op.alter_column(
            table_name,
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            existing_nullable=False,
        )
        op.alter_column(
            table_name,
            "updated_at",
            existing_type=sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            existing_nullable=False,
        )


def downgrade() -> None:
    for table_name in reversed(TABLES):
        op.alter_column(
            table_name,
            "updated_at",
            existing_type=sa.DateTime(timezone=True),
            server_default=None,
            existing_nullable=False,
        )
        op.alter_column(
            table_name,
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            server_default=None,
            existing_nullable=False,
        )
