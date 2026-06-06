"""add referral fields to users

Revision ID: e8f9a0b1c2d3
Revises: d7e8f9a0b1c2
Create Date: 2026-03-19 17:40:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(inspector) -> set[str]:
    return {column["name"] for column in inspector.get_columns("users")}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = _column_names(inspector)

    if "referral_code" not in columns:
        op.add_column("users", sa.Column("referral_code", sa.String(length=32), nullable=True))
        op.create_index("ix_users_referral_code", "users", ["referral_code"], unique=True)
    if "referred_by_user_id" not in columns:
        op.add_column("users", sa.Column("referred_by_user_id", postgresql.UUID(as_uuid=True), nullable=True))
        op.create_index("ix_users_referred_by_user_id", "users", ["referred_by_user_id"], unique=False)
        op.create_foreign_key(
            "fk_users_referred_by_user_id_users",
            "users",
            "users",
            ["referred_by_user_id"],
            ["id"],
        )
    if "referral_discount_used_at" not in columns:
        op.add_column("users", sa.Column("referral_discount_used_at", sa.DateTime(timezone=True), nullable=True))
    if "referral_bonus_awarded_at" not in columns:
        op.add_column("users", sa.Column("referral_bonus_awarded_at", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        UPDATE users
        SET referral_code = UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 10))
        WHERE referral_code IS NULL
        """
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = _column_names(inspector)

    if "referral_bonus_awarded_at" in columns:
        op.drop_column("users", "referral_bonus_awarded_at")
    if "referral_discount_used_at" in columns:
        op.drop_column("users", "referral_discount_used_at")
    if "referred_by_user_id" in columns:
        op.drop_constraint("fk_users_referred_by_user_id_users", "users", type_="foreignkey")
        op.drop_index("ix_users_referred_by_user_id", table_name="users")
        op.drop_column("users", "referred_by_user_id")
    if "referral_code" in columns:
        op.drop_index("ix_users_referral_code", table_name="users")
        op.drop_column("users", "referral_code")
