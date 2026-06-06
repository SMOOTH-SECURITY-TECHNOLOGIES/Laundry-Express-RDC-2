"""align disputes table with model

Revision ID: c4f2a6b8d1e9
Revises: b2e4f6a9c1d3
Create Date: 2026-03-18 21:15:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4f2a6b8d1e9"
down_revision = "b2e4f6a9c1d3"
branch_labels = None
depends_on = None


def _get_columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def _get_foreign_keys(table_name: str) -> list[dict]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return inspector.get_foreign_keys(table_name)


def upgrade() -> None:
    columns = _get_columns("disputes")

    if "title" not in columns:
        op.add_column("disputes", sa.Column("title", sa.String(length=255), nullable=True))
        op.execute("UPDATE disputes SET title = LEFT(description, 255) WHERE title IS NULL")
        op.execute("UPDATE disputes SET title = 'Legacy dispute' WHERE title IS NULL OR title = ''")
        op.alter_column("disputes", "title", existing_type=sa.String(length=255), nullable=False)

    foreign_keys = _get_foreign_keys("disputes")
    partner_fk = next(
        (fk for fk in foreign_keys if fk.get("constrained_columns") == ["partner_id"]),
        None,
    )
    if partner_fk and partner_fk.get("referred_table") != "partners":
        if partner_fk.get("name"):
            op.drop_constraint(partner_fk["name"], "disputes", type_="foreignkey")
        op.create_foreign_key(
            "disputes_partner_id_fkey",
            "disputes",
            "partners",
            ["partner_id"],
            ["id"],
        )


def downgrade() -> None:
    foreign_keys = _get_foreign_keys("disputes")
    partner_fk = next(
        (fk for fk in foreign_keys if fk.get("constrained_columns") == ["partner_id"]),
        None,
    )
    if partner_fk and partner_fk.get("referred_table") == "partners":
        if partner_fk.get("name"):
            op.drop_constraint(partner_fk["name"], "disputes", type_="foreignkey")
        op.create_foreign_key(
            "disputes_partner_id_fkey",
            "disputes",
            "users",
            ["partner_id"],
            ["id"],
        )

    columns = _get_columns("disputes")
    if "title" in columns:
        op.drop_column("disputes", "title")
