"""create cms tables

Revision ID: m7n8o9p0q1r2
Revises: l6m7n8o9p0q1
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "m7n8o9p0q1r2"
down_revision = "l6m7n8o9p0q1"
branch_labels = None
depends_on = None


def _base_cols():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "cms_pages",
        *_base_cols(),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("page_type", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("template", sa.String(64), nullable=True),
        sa.Column("seo_title", sa.String(255), nullable=True),
        sa.Column("seo_description", sa.Text(), nullable=True),
        sa.Column("og_title", sa.String(255), nullable=True),
        sa.Column("og_description", sa.Text(), nullable=True),
        sa.Column("og_image", sa.String(512), nullable=True),
        sa.Column("canonical_url", sa.String(512), nullable=True),
        sa.Column("publish_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("unpublish_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("views_7d", sa.Integer(), server_default="0", nullable=False),
        sa.Column("conversions_7d", sa.Integer(), server_default="0", nullable=False),
        sa.Column("seo_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_cms_pages_slug", "cms_pages", ["slug"])
    op.create_index("ix_cms_pages_status", "cms_pages", ["status"])

    for name, cols in [
        ("cms_sections", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=False),
            sa.Column("type", sa.String(64), nullable=False),
            sa.Column("position", sa.Integer(), server_default="0", nullable=False),
            sa.Column("title", sa.String(255)), sa.Column("subtitle", sa.Text()), sa.Column("content", sa.Text()),
            sa.Column("json_data", postgresql.JSONB()), sa.Column("is_visible", sa.Boolean(), server_default="true", nullable=False),
        ]),
        ("cms_faqs", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=True),
            sa.Column("question", sa.Text(), nullable=False), sa.Column("answer", sa.Text(), nullable=False),
            sa.Column("position", sa.Integer(), server_default="0", nullable=False),
            sa.Column("published", sa.Boolean(), server_default="true", nullable=False),
        ]),
        ("cms_media", [
            sa.Column("filename", sa.String(255), nullable=False), sa.Column("file_url", sa.String(512), nullable=False),
            sa.Column("mime_type", sa.String(128)), sa.Column("size", sa.Integer()), sa.Column("alt_text", sa.String(255)),
            sa.Column("thumbnail_url", sa.String(512)), sa.Column("medium_url", sa.String(512)),
            sa.Column("large_url", sa.String(512)), sa.Column("webp_url", sa.String(512)),
            sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        ]),
        ("cms_navigation", [
            sa.Column("menu_type", sa.String(32), server_default="header", nullable=False),
            sa.Column("label", sa.String(128), nullable=False), sa.Column("url", sa.String(512), nullable=False),
            sa.Column("position", sa.Integer(), server_default="0", nullable=False),
            sa.Column("icon", sa.String(64)), sa.Column("visible", sa.Boolean(), server_default="true", nullable=False),
            sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_navigation.id"), nullable=True),
        ]),
        ("cms_translations", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=False),
            sa.Column("language", sa.String(8), server_default="fr", nullable=False),
            sa.Column("field_key", sa.String(64), nullable=False), sa.Column("value", sa.Text(), nullable=False),
        ]),
        ("cms_revisions", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=False),
            sa.Column("snapshot", postgresql.JSONB(), nullable=False),
            sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("note", sa.String(255)),
        ]),
        ("cms_publish_history", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=False),
            sa.Column("action", sa.String(32), nullable=False),
            sa.Column("old_status", sa.String(32)), sa.Column("new_status", sa.String(32)),
            sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        ]),
        ("cms_seo", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), unique=True, nullable=False),
            sa.Column("seo_title", sa.String(255)), sa.Column("seo_description", sa.Text()),
            sa.Column("keywords", sa.String(512)), sa.Column("canonical_url", sa.String(512)),
            sa.Column("og_title", sa.String(255)), sa.Column("og_description", sa.Text()),
            sa.Column("og_image", sa.String(512)), sa.Column("og_type", sa.String(64), server_default="website"),
            sa.Column("twitter_card", sa.String(64), server_default="summary_large_image"),
            sa.Column("schema_json", postgresql.JSONB()), sa.Column("score", sa.Integer(), server_default="0", nullable=False),
        ]),
        ("cms_templates", [
            sa.Column("key", sa.String(64), unique=True, nullable=False),
            sa.Column("label", sa.String(128), nullable=False), sa.Column("description", sa.Text()),
            sa.Column("preview_url", sa.String(512)), sa.Column("blocks_schema", postgresql.JSONB()),
        ]),
        ("cms_blocks", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=False),
            sa.Column("block_type", sa.String(64), nullable=False),
            sa.Column("position", sa.Integer(), server_default="0", nullable=False),
            sa.Column("json_data", postgresql.JSONB(), nullable=False),
            sa.Column("is_visible", sa.Boolean(), server_default="true", nullable=False),
        ]),
        ("cms_analytics", [
            sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cms_pages.id"), nullable=False),
            sa.Column("date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("views", sa.Integer(), server_default="0", nullable=False),
            sa.Column("ctr", sa.Float(), server_default="0", nullable=False),
            sa.Column("bounce_rate", sa.Float(), server_default="0", nullable=False),
            sa.Column("conversion_rate", sa.Float(), server_default="0", nullable=False),
            sa.Column("leads", sa.Integer(), server_default="0", nullable=False),
            sa.Column("revenue", sa.Float(), server_default="0", nullable=False),
        ]),
    ]:
        op.create_table(name, *_base_cols(), *cols)


def downgrade() -> None:
    for t in ["cms_analytics", "cms_blocks", "cms_templates", "cms_seo", "cms_publish_history",
              "cms_revisions", "cms_translations", "cms_navigation", "cms_media", "cms_faqs",
              "cms_sections", "cms_pages"]:
        op.drop_table(t)
