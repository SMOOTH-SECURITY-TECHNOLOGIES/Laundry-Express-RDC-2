"""create ad analytics tables

Revision ID: g1h2i3j4k5l6
Revises: f9a0b1c2d3e4
Create Date: 2026-06-08 20:45:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "g1h2i3j4k5l6"
down_revision = "f9a0b1c2d3e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("ad_campaigns"):
        op.create_table(
            "ad_campaigns",
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("objective", sa.String(32), nullable=False),
            sa.Column("budget", sa.Numeric(12, 2), nullable=False, server_default="0"),
            sa.Column("budget_spent", sa.Numeric(12, 2), nullable=False, server_default="0"),
            sa.Column("status", sa.String(32), nullable=False, server_default="active"),
            sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("target_audience", sa.Text(), nullable=True),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )

    if not inspector.has_table("advertisements"):
        op.create_table(
            "advertisements",
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("creative_type", sa.String(32), nullable=False, server_default="image"),
            sa.Column("image_url", sa.Text(), nullable=True),
            sa.Column("video_url", sa.Text(), nullable=True),
            sa.Column("cta_text", sa.String(128), nullable=True),
            sa.Column("cta_url", sa.Text(), nullable=True),
            sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
            sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ad_campaigns.id"), nullable=True),
            sa.Column("budget_total", sa.Numeric(12, 2), nullable=False, server_default="0"),
            sa.Column("budget_spent", sa.Numeric(12, 2), nullable=False, server_default="0"),
            sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("partner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("partners.id"), nullable=True),
            sa.Column("channel", sa.String(32), nullable=True),
            sa.Column("zone", sa.String(64), nullable=True),
            sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )

    for table, cols in [
        ("ad_impressions", [
            ("advertisement_id", postgresql.UUID(as_uuid=True), "advertisements.id"),
            ("viewer_id", postgresql.UUID(as_uuid=True), "users.id"),
            ("surface", sa.String(32)),
        ]),
        ("ad_clicks", [
            ("advertisement_id", postgresql.UUID(as_uuid=True), "advertisements.id"),
            ("user_id", postgresql.UUID(as_uuid=True), "users.id"),
            ("surface", sa.String(32)),
        ]),
        ("ad_conversions", [
            ("advertisement_id", postgresql.UUID(as_uuid=True), "advertisements.id"),
            ("order_id", postgresql.UUID(as_uuid=True), "orders.id"),
            ("revenue_generated", sa.Numeric(12, 2)),
        ]),
    ]:
        if inspector.has_table(table):
            continue
        col_defs = [sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False)]
        for col in cols:
            if len(col) == 2:
                name, col_type = col
                if name == "revenue_generated":
                    col_defs.append(
                        sa.Column(name, sa.Numeric(12, 2), nullable=False, server_default="0")
                    )
                else:
                    col_defs.append(
                        sa.Column(name, col_type, nullable=False, server_default="homepage")
                    )
            else:
                name, col_type, fk = col
                col_defs.append(
                    sa.Column(
                        name,
                        col_type,
                        sa.ForeignKey(fk),
                        nullable=True if name.endswith("_id") and name != "advertisement_id" else False,
                    )
                )
        col_defs.extend([
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        ])
        op.create_table(table, *col_defs, sa.PrimaryKeyConstraint("id"))

    if not inspector.has_table("ad_experiments"):
        op.create_table(
            "ad_experiments",
            sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ad_campaigns.id"), nullable=True),
            sa.Column("variant_a", sa.String(255), nullable=False),
            sa.Column("variant_b", sa.String(255), nullable=False),
            sa.Column("winner", sa.String(8), nullable=True),
            sa.Column("status", sa.String(32), nullable=False, server_default="running"),
            sa.Column("variant_a_ctr", sa.Numeric(8, 4), nullable=True),
            sa.Column("variant_b_ctr", sa.Numeric(8, 4), nullable=True),
            sa.Column("variant_a_conversion", sa.Numeric(8, 4), nullable=True),
            sa.Column("variant_b_conversion", sa.Numeric(8, 4), nullable=True),
            sa.Column("variant_a_roi", sa.Numeric(8, 2), nullable=True),
            sa.Column("variant_b_roi", sa.Numeric(8, 2), nullable=True),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    for table in ["ad_experiments", "ad_conversions", "ad_clicks", "ad_impressions", "advertisements", "ad_campaigns"]:
        bind = op.get_bind()
        inspector = sa.inspect(bind)
        if inspector.has_table(table):
            op.drop_table(table)
