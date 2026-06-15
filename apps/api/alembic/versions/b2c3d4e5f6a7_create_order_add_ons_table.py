"""create order add-ons table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f7
Create Date: 2026-06-10 12:00:00.000000
"""
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f7"
branch_labels = None
depends_on = None

DEFAULT_ADD_ONS = [
    {
        "slug": "chaussures",
        "name": "Nettoyage chaussures",
        "description": "Entretien complet de vos chaussures.",
        "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=180&q=80",
        "price": 5,
        "sort_order": 1,
    },
    {
        "slug": "repassage-premium",
        "name": "Repassage premium",
        "description": "Repassage vapeur professionnel.",
        "image_url": "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=180&q=80",
        "price": 3,
        "sort_order": 2,
    },
    {
        "slug": "desodorisation",
        "name": "Desodorisation textile",
        "description": "Elimine les odeurs et rafraichit.",
        "image_url": "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=180&q=80",
        "price": 2,
        "sort_order": 3,
    },
    {
        "slug": "sac-transport",
        "name": "Sac de transport",
        "description": "Sac premium pour votre linge.",
        "image_url": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=180&q=80",
        "price": 2,
        "sort_order": 4,
    },
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("order_add_ons"):
        return

    op.create_table(
        "order_add_ons",
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("image_url", sa.String(length=2048), nullable=False, server_default=""),
        sa.Column("price", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_add_ons_slug"), "order_add_ons", ["slug"], unique=True)

    table = sa.table(
        "order_add_ons",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("slug", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("image_url", sa.String),
        sa.column("price", sa.Numeric),
        sa.column("sort_order", sa.Integer),
        sa.column("is_active", sa.Boolean),
    )
    op.bulk_insert(
        table,
        [
            {
                "id": str(uuid4()),
                "slug": item["slug"],
                "name": item["name"],
                "description": item["description"],
                "image_url": item["image_url"],
                "price": item["price"],
                "sort_order": item["sort_order"],
                "is_active": True,
            }
            for item in DEFAULT_ADD_ONS
        ],
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("order_add_ons"):
        return
    op.drop_index(op.f("ix_order_add_ons_slug"), table_name="order_add_ons")
    op.drop_table("order_add_ons")
