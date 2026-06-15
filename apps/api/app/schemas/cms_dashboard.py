from pydantic import BaseModel, Field


class CMSKpiResponse(BaseModel):
    published_pages: int = 0
    published_change: float = 0
    published_sparkline: list[int] = Field(default_factory=list)
    drafts: int = 0
    drafts_change: float = 0
    drafts_sparkline: list[int] = Field(default_factory=list)
    scheduled_pages: int = 0
    scheduled_change: float = 0
    scheduled_sparkline: list[int] = Field(default_factory=list)
    blog_posts: int = 0
    blog_change: float = 0
    blog_sparkline: list[int] = Field(default_factory=list)
    visitors_7d: int = 0
    visitors_change: float = 0
    visitors_sparkline: list[int] = Field(default_factory=list)
    conversions_7d: int = 0
    conversions_change: float = 0
    conversions_sparkline: list[int] = Field(default_factory=list)
    avg_seo_score: float = 0
    seo_change: float = 0
    seo_sparkline: list[float] = Field(default_factory=list)
    revenue_generated: float = 0
    revenue_change: float = 0
    revenue_sparkline: list[float] = Field(default_factory=list)


class CMSPageListItem(BaseModel):
    id: str
    slug: str
    title: str
    page_type: str
    page_type_label: str
    status: str
    status_label: str
    language: str
    updated_at: str | None
    views_7d: int
    seo_score: int
    thumbnail_url: str | None = None


class CMSSiteTreeNode(BaseModel):
    id: str
    label: str
    slug: str
    children: list["CMSSiteTreeNode"] = Field(default_factory=list)


class CMSPublicationStatus(BaseModel):
    status: str
    label: str
    count: int
    percent: float
    color: str


class CMSTopPage(BaseModel):
    page_id: str
    title: str
    slug: str
    views: int
    percent: float


class CMSRevisionItem(BaseModel):
    id: str
    page_title: str
    action: str
    user_name: str
    created_at: str | None


class CMSLanguageStat(BaseModel):
    language: str
    label: str
    page_count: int


class CMSTemplateItem(BaseModel):
    key: str
    label: str
    description: str
    preview_url: str | None


class CMSMediaItem(BaseModel):
    id: str
    filename: str
    file_url: str
    mime_type: str | None
    size: int | None
    thumbnail_url: str | None


class CMSAiSuggestion(BaseModel):
    id: str
    text: str
    category: str


class CMSDashboardResponse(BaseModel):
    kpis: CMSKpiResponse
    pages: list[CMSPageListItem] = Field(default_factory=list)
    site_tree: list[CMSSiteTreeNode] = Field(default_factory=list)
    publication_status: list[CMSPublicationStatus] = Field(default_factory=list)
    seo_score: float = 0
    seo_checklist: list[dict] = Field(default_factory=list)
    top_pages: list[CMSTopPage] = Field(default_factory=list)
    recent_revisions: list[CMSRevisionItem] = Field(default_factory=list)
    languages: list[CMSLanguageStat] = Field(default_factory=list)
    templates: list[CMSTemplateItem] = Field(default_factory=list)
    ai_suggestions: list[CMSAiSuggestion] = Field(default_factory=list)
    recent_media: list[CMSMediaItem] = Field(default_factory=list)
    source: str = "backend"


class CMSPageCreateRequest(BaseModel):
    title: str
    slug: str
    page_type: str = "custom"
    description: str | None = None
    template: str | None = "default"


class CMSPageUpdateRequest(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    page_type: str | None = None
    status: str | None = None
    template: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None
    canonical_url: str | None = None
    publish_at: str | None = None
    blocks: list[dict] | None = None
    sections: list[dict] | None = None


class CMSFAQRequest(BaseModel):
    question: str
    answer: str
    page_id: str | None = None
    position: int = 0
    published: bool = True


class CMSMediaRequest(BaseModel):
    filename: str
    file_url: str
    mime_type: str | None = None
    size: int | None = None
    alt_text: str | None = None


class CMSSEORequest(BaseModel):
    page_id: str
    seo_title: str | None = None
    seo_description: str | None = None
    keywords: str | None = None
    canonical_url: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None
    og_type: str | None = None
    twitter_card: str | None = None
    schema_json: dict | None = None


class CMSPageDetailResponse(CMSPageListItem):
    description: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None
    canonical_url: str | None = None
    blocks: list[dict] = Field(default_factory=list)
    sections: list[dict] = Field(default_factory=list)
    faqs: list[dict] = Field(default_factory=list)
    revisions: list[dict] = Field(default_factory=list)
    translations: list[dict] = Field(default_factory=list)
    publish_history: list[dict] = Field(default_factory=list)
