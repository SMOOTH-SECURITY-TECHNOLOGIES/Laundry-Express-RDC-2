import uuid
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

blog_post_tags = Table(
    "blog_post_tags",
    BaseModel.metadata,
    Column("post_id", UUID(as_uuid=True), ForeignKey("blog_posts.id"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("blog_tags.id"), primary_key=True),
)


class BlogPostStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BlogCommentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SPAM = "spam"
    DELETED = "deleted"


class BlogCategory(BaseModel):
    __tablename__ = "blog_categories"

    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    color = Column(String(16), nullable=True, default="#3B82F6")
    post_count = Column(Integer, nullable=False, default=0)
    posts = relationship("BlogPost", back_populates="category")


class BlogTag(BaseModel):
    __tablename__ = "blog_tags"

    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(64), nullable=False)
    post_count = Column(Integer, nullable=False, default=0)


class BlogAuthor(BaseModel):
    __tablename__ = "blog_authors"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String(128), nullable=False)
    bio = Column(Text, nullable=True)
    avatar = Column(String(512), nullable=True)
    social_links = Column(JSONB, nullable=True)
    role = Column(String(64), nullable=True, default="Rédacteur")
    posts = relationship("BlogPost", back_populates="author")


class BlogPost(BaseModel):
    __tablename__ = "blog_posts"

    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=False, default="")
    featured_image = Column(String(512), nullable=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("blog_authors.id"), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("blog_categories.id"), nullable=True)
    status = Column(String(32), nullable=False, default=BlogPostStatus.DRAFT.value)
    reading_time = Column(Integer, nullable=False, default=5)
    published_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    views_count = Column(Integer, nullable=False, default=0)
    likes_count = Column(Integer, nullable=False, default=0)
    bookmarks_count = Column(Integer, nullable=False, default=0)
    comments_count = Column(Integer, nullable=False, default=0)
    seo_score = Column(Integer, nullable=False, default=0)
    lead_score = Column(Integer, nullable=False, default=0)
    content_blocks = Column(JSONB, nullable=True, default=list)

    author = relationship("BlogAuthor", back_populates="posts")
    category = relationship("BlogCategory", back_populates="posts")
    tags = relationship("BlogTag", secondary=blog_post_tags)
    comments = relationship("BlogComment", back_populates="post", cascade="all, delete-orphan")
    revisions = relationship("BlogRevision", back_populates="post", cascade="all, delete-orphan")
    seo = relationship("BlogSEO", back_populates="post", uselist=False, cascade="all, delete-orphan")
    ai_content = relationship("BlogAIContent", back_populates="post", uselist=False, cascade="all, delete-orphan")
    views = relationship("BlogView", back_populates="post", cascade="all, delete-orphan")
    analytics = relationship("BlogAnalytics", back_populates="post", cascade="all, delete-orphan")
    leads = relationship("BlogLead", back_populates="post", cascade="all, delete-orphan")
    translations = relationship("BlogTranslation", back_populates="post", cascade="all, delete-orphan")


class BlogComment(BaseModel):
    __tablename__ = "blog_comments"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    author_name = Column(String(128), nullable=False)
    author_email = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    status = Column(String(16), nullable=False, default=BlogCommentStatus.PENDING.value)
    post = relationship("BlogPost", back_populates="comments")


class BlogRevision(BaseModel):
    __tablename__ = "blog_revisions"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    snapshot = Column(JSONB, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    note = Column(String(255), nullable=True)
    post = relationship("BlogPost", back_populates="revisions")


class BlogView(BaseModel):
    __tablename__ = "blog_views"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    visitor_id = Column(String(64), nullable=True)
    source = Column(String(64), nullable=True)
    post = relationship("BlogPost", back_populates="views")


class BlogLike(BaseModel):
    __tablename__ = "blog_likes"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class BlogBookmark(BaseModel):
    __tablename__ = "blog_bookmarks"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class BlogRelatedPost(BaseModel):
    __tablename__ = "blog_related_posts"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    related_post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False)


class BlogSEO(BaseModel):
    __tablename__ = "blog_seo"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), unique=True, nullable=False)
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    focus_keyword = Column(String(128), nullable=True)
    secondary_keywords = Column(String(512), nullable=True)
    canonical_url = Column(String(512), nullable=True)
    og_title = Column(String(255), nullable=True)
    og_description = Column(Text, nullable=True)
    og_image = Column(String(512), nullable=True)
    twitter_card = Column(String(64), nullable=True, default="summary_large_image")
    schema_markup = Column(JSONB, nullable=True)
    score = Column(Integer, nullable=False, default=0)
    post = relationship("BlogPost", back_populates="seo")


class BlogAIContent(BaseModel):
    __tablename__ = "blog_ai_content"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), unique=True, nullable=False)
    outline = Column(JSONB, nullable=True)
    faq = Column(JSONB, nullable=True)
    cta = Column(JSONB, nullable=True)
    suggestions = Column(JSONB, nullable=True)
    visibility_score = Column(Integer, nullable=False, default=0)
    post = relationship("BlogPost", back_populates="ai_content")


class BlogAnalytics(BaseModel):
    __tablename__ = "blog_analytics"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    views = Column(Integer, nullable=False, default=0)
    unique_visitors = Column(Integer, nullable=False, default=0)
    reading_time_avg = Column(Float, nullable=False, default=0.0)
    scroll_depth = Column(Float, nullable=False, default=0.0)
    ctr = Column(Float, nullable=False, default=0.0)
    conversions = Column(Integer, nullable=False, default=0)
    leads = Column(Integer, nullable=False, default=0)
    revenue = Column(Float, nullable=False, default=0.0)
    post = relationship("BlogPost", back_populates="analytics")


class BlogLead(BaseModel):
    __tablename__ = "blog_leads"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=True, index=True)
    email = Column(String(255), nullable=False)
    source = Column(String(64), nullable=True, default="blog")
    campaign = Column(String(128), nullable=True)
    post = relationship("BlogPost", back_populates="leads")


class BlogTranslation(BaseModel):
    __tablename__ = "blog_translations"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    language = Column(String(8), nullable=False, default="fr")
    field_key = Column(String(64), nullable=False)
    value = Column(Text, nullable=False)
    post = relationship("BlogPost", back_populates="translations")


class BlogCalendar(BaseModel):
    __tablename__ = "blog_calendar"

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=True)
    title = Column(String(255), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    campaign = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="scheduled")
