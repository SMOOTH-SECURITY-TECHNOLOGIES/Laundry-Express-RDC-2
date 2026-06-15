"""create blog tables

Revision ID: n8o9p0q1r2s3
Revises: m7n8o9p0q1r2
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "n8o9p0q1r2s3"
down_revision = "m7n8o9p0q1r2"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("blog_categories", *_base(),
        sa.Column("slug", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("color", sa.String(16)), sa.Column("post_count", sa.Integer(), server_default="0", nullable=False))
    op.create_table("blog_tags", *_base(),
        sa.Column("slug", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("post_count", sa.Integer(), server_default="0", nullable=False))
    op.create_table("blog_authors", *_base(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("name", sa.String(128), nullable=False), sa.Column("bio", sa.Text()),
        sa.Column("avatar", sa.String(512)), sa.Column("social_links", postgresql.JSONB()),
        sa.Column("role", sa.String(64), server_default="Rédacteur"))
    op.create_table("blog_posts", *_base(),
        sa.Column("slug", sa.String(255), unique=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False), sa.Column("excerpt", sa.Text()),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("featured_image", sa.String(512)),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_authors.id"), nullable=True),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_categories.id"), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("reading_time", sa.Integer(), server_default="5", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)), sa.Column("scheduled_at", sa.DateTime(timezone=True)),
        sa.Column("views_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("likes_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("bookmarks_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("comments_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("seo_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("lead_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("content_blocks", postgresql.JSONB()))
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"])
    op.create_index("ix_blog_posts_status", "blog_posts", ["status"])
    op.create_table("blog_post_tags",
        sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), primary_key=True),
        sa.Column("tag_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_tags.id"), primary_key=True))
    for name, cols in [
        ("blog_comments", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("author_name", sa.String(128), nullable=False), sa.Column("author_email", sa.String(255)),
            sa.Column("content", sa.Text(), nullable=False), sa.Column("status", sa.String(16), server_default="pending", nullable=False),
        ]),
        ("blog_revisions", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("snapshot", postgresql.JSONB(), nullable=False),
            sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("note", sa.String(255)),
        ]),
        ("blog_views", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("visitor_id", sa.String(64)), sa.Column("source", sa.String(64)),
        ]),
        ("blog_likes", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        ]),
        ("blog_bookmarks", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        ]),
        ("blog_related_posts", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("related_post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
        ]),
        ("blog_seo", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), unique=True, nullable=False),
            sa.Column("seo_title", sa.String(255)), sa.Column("seo_description", sa.Text()),
            sa.Column("focus_keyword", sa.String(128)), sa.Column("secondary_keywords", sa.String(512)),
            sa.Column("canonical_url", sa.String(512)), sa.Column("og_title", sa.String(255)),
            sa.Column("og_description", sa.Text()), sa.Column("og_image", sa.String(512)),
            sa.Column("twitter_card", sa.String(64), server_default="summary_large_image"),
            sa.Column("schema_markup", postgresql.JSONB()), sa.Column("score", sa.Integer(), server_default="0", nullable=False),
        ]),
        ("blog_ai_content", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), unique=True, nullable=False),
            sa.Column("outline", postgresql.JSONB()), sa.Column("faq", postgresql.JSONB()),
            sa.Column("cta", postgresql.JSONB()), sa.Column("suggestions", postgresql.JSONB()),
            sa.Column("visibility_score", sa.Integer(), server_default="0", nullable=False),
        ]),
        ("blog_analytics", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("views", sa.Integer(), server_default="0", nullable=False),
            sa.Column("unique_visitors", sa.Integer(), server_default="0", nullable=False),
            sa.Column("reading_time_avg", sa.Float(), server_default="0", nullable=False),
            sa.Column("scroll_depth", sa.Float(), server_default="0", nullable=False),
            sa.Column("ctr", sa.Float(), server_default="0", nullable=False),
            sa.Column("conversions", sa.Integer(), server_default="0", nullable=False),
            sa.Column("leads", sa.Integer(), server_default="0", nullable=False),
            sa.Column("revenue", sa.Float(), server_default="0", nullable=False),
        ]),
        ("blog_leads", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("source", sa.String(64), server_default="blog"),
            sa.Column("campaign", sa.String(128)),
        ]),
        ("blog_translations", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=False),
            sa.Column("language", sa.String(8), server_default="fr", nullable=False),
            sa.Column("field_key", sa.String(64), nullable=False), sa.Column("value", sa.Text(), nullable=False),
        ]),
        ("blog_calendar", [
            sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("blog_posts.id"), nullable=True),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("campaign", sa.String(128)), sa.Column("status", sa.String(32), server_default="scheduled", nullable=False),
        ]),
    ]:
        op.create_table(name, *_base(), *cols)


def downgrade() -> None:
    for t in ["blog_calendar", "blog_translations", "blog_leads", "blog_analytics", "blog_ai_content",
              "blog_seo", "blog_related_posts", "blog_bookmarks", "blog_likes", "blog_views",
              "blog_revisions", "blog_comments", "blog_post_tags", "blog_posts",
              "blog_authors", "blog_tags", "blog_categories"]:
        op.drop_table(t)
