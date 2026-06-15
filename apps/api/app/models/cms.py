import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class CMSPageType(str, Enum):
    HOME = "home"
    LANDING = "landing"
    SERVICE = "service"
    PARTNER = "partner"
    BLOG = "blog"
    FAQ = "faq"
    ABOUT = "about"
    CONTACT = "contact"
    LEGAL = "legal"
    CUSTOM = "custom"


class CMSPageStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CMSPage(BaseModel):
    __tablename__ = "cms_pages"

    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    page_type = Column(String(32), nullable=False, default=CMSPageType.CUSTOM.value)
    status = Column(String(32), nullable=False, default=CMSPageStatus.DRAFT.value)
    template = Column(String(64), nullable=True, default="default")
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    og_title = Column(String(255), nullable=True)
    og_description = Column(Text, nullable=True)
    og_image = Column(String(512), nullable=True)
    canonical_url = Column(String(512), nullable=True)
    publish_at = Column(DateTime(timezone=True), nullable=True)
    unpublish_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    views_7d = Column(Integer, nullable=False, default=0)
    conversions_7d = Column(Integer, nullable=False, default=0)
    seo_score = Column(Integer, nullable=False, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    sections = relationship("CMSSection", back_populates="page", cascade="all, delete-orphan")
    faqs = relationship("CMSFAQ", back_populates="page", cascade="all, delete-orphan")
    blocks = relationship("CMSBlock", back_populates="page", cascade="all, delete-orphan")
    revisions = relationship("CMSRevision", back_populates="page", cascade="all, delete-orphan")
    seo = relationship("CMSSEO", back_populates="page", uselist=False, cascade="all, delete-orphan")
    translations = relationship("CMSTranslation", back_populates="page", cascade="all, delete-orphan")
    publish_history = relationship("CMSPublishHistory", back_populates="page", cascade="all, delete-orphan")


class CMSSection(BaseModel):
    __tablename__ = "cms_sections"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), nullable=False, index=True)
    type = Column(String(64), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    title = Column(String(255), nullable=True)
    subtitle = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    json_data = Column(JSONB, nullable=True, default=dict)
    is_visible = Column(Boolean, nullable=False, default=True)
    page = relationship("CMSPage", back_populates="sections")


class CMSFAQ(BaseModel):
    __tablename__ = "cms_faqs"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), nullable=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    published = Column(Boolean, nullable=False, default=True)
    page = relationship("CMSPage", back_populates="faqs")


class CMSMedia(BaseModel):
    __tablename__ = "cms_media"

    filename = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=False)
    mime_type = Column(String(128), nullable=True)
    size = Column(Integer, nullable=True)
    alt_text = Column(String(255), nullable=True)
    thumbnail_url = Column(String(512), nullable=True)
    medium_url = Column(String(512), nullable=True)
    large_url = Column(String(512), nullable=True)
    webp_url = Column(String(512), nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class CMSNavigation(BaseModel):
    __tablename__ = "cms_navigation"

    menu_type = Column(String(32), nullable=False, default="header")
    label = Column(String(128), nullable=False)
    url = Column(String(512), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    icon = Column(String(64), nullable=True)
    visible = Column(Boolean, nullable=False, default=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("cms_navigation.id"), nullable=True)


class CMSTranslation(BaseModel):
    __tablename__ = "cms_translations"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), nullable=False, index=True)
    language = Column(String(8), nullable=False, default="fr")
    field_key = Column(String(64), nullable=False)
    value = Column(Text, nullable=False)
    page = relationship("CMSPage", back_populates="translations")


class CMSRevision(BaseModel):
    __tablename__ = "cms_revisions"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), nullable=False, index=True)
    snapshot = Column(JSONB, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    note = Column(String(255), nullable=True)
    page = relationship("CMSPage", back_populates="revisions")


class CMSPublishHistory(BaseModel):
    __tablename__ = "cms_publish_history"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), nullable=False, index=True)
    action = Column(String(32), nullable=False)
    old_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    page = relationship("CMSPage", back_populates="publish_history")


class CMSSEO(BaseModel):
    __tablename__ = "cms_seo"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), unique=True, nullable=False)
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    keywords = Column(String(512), nullable=True)
    canonical_url = Column(String(512), nullable=True)
    og_title = Column(String(255), nullable=True)
    og_description = Column(Text, nullable=True)
    og_image = Column(String(512), nullable=True)
    og_type = Column(String(64), nullable=True, default="website")
    twitter_card = Column(String(64), nullable=True, default="summary_large_image")
    schema_json = Column(JSONB, nullable=True)
    score = Column(Integer, nullable=False, default=0)
    page = relationship("CMSPage", back_populates="seo")


class CMSTemplate(BaseModel):
    __tablename__ = "cms_templates"

    key = Column(String(64), unique=True, nullable=False)
    label = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    preview_url = Column(String(512), nullable=True)
    blocks_schema = Column(JSONB, nullable=True, default=list)


class CMSBlock(BaseModel):
    __tablename__ = "cms_blocks"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), nullable=False, index=True)
    block_type = Column(String(64), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    json_data = Column(JSONB, nullable=False, default=dict)
    is_visible = Column(Boolean, nullable=False, default=True)
    page = relationship("CMSPage", back_populates="blocks")


class CMSAnalytics(BaseModel):
    __tablename__ = "cms_analytics"

    page_id = Column(UUID(as_uuid=True), ForeignKey("cms_pages.id"), nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    views = Column(Integer, nullable=False, default=0)
    ctr = Column(Float, nullable=False, default=0.0)
    bounce_rate = Column(Float, nullable=False, default=0.0)
    conversion_rate = Column(Float, nullable=False, default=0.0)
    leads = Column(Integer, nullable=False, default=0)
    revenue = Column(Float, nullable=False, default=0.0)
