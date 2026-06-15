from pydantic import BaseModel, Field


class BlogKpiResponse(BaseModel):
    published_posts: int = 0
    published_change: float = 0
    published_sparkline: list[int] = Field(default_factory=list)
    drafts: int = 0
    drafts_change: float = 0
    drafts_sparkline: list[int] = Field(default_factory=list)
    scheduled_posts: int = 0
    scheduled_change: float = 0
    scheduled_sparkline: list[int] = Field(default_factory=list)
    monthly_views: int = 0
    monthly_views_change: float = 0
    monthly_views_sparkline: list[int] = Field(default_factory=list)
    leads_generated: int = 0
    leads_change: float = 0
    leads_sparkline: list[int] = Field(default_factory=list)
    conversions: int = 0
    conversions_change: float = 0
    conversions_sparkline: list[int] = Field(default_factory=list)
    avg_seo_score: float = 0
    seo_change: float = 0
    seo_sparkline: list[float] = Field(default_factory=list)


class BlogPostListItem(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    author_name: str
    author_avatar: str | None
    category: str
    category_color: str
    status: str
    status_label: str
    seo_score: int
    views_count: int
    comments_count: int
    published_at: str | None
    featured_image: str | None


class BlogCategoryItem(BaseModel):
    id: str
    name: str
    slug: str
    post_count: int
    color: str


class BlogTagItem(BaseModel):
    id: str
    name: str
    slug: str
    post_count: int


class BlogSeoDistribution(BaseModel):
    label: str
    count: int
    percent: float
    color: str


class BlogTopPost(BaseModel):
    post_id: str
    title: str
    views: int
    ctr: float
    leads: int
    seo_score: int


class BlogTrendPoint(BaseModel):
    date: str
    views: int
    leads: int


class BlogAiSuggestion(BaseModel):
    id: str
    text: str
    category: str


class BlogCalendarDay(BaseModel):
    date: str
    post_count: int


class BlogDashboardResponse(BaseModel):
    kpis: BlogKpiResponse
    posts: list[BlogPostListItem] = Field(default_factory=list)
    categories: list[BlogCategoryItem] = Field(default_factory=list)
    tags: list[BlogTagItem] = Field(default_factory=list)
    seo_distribution: list[BlogSeoDistribution] = Field(default_factory=list)
    top_posts: list[BlogTopPost] = Field(default_factory=list)
    trends: list[BlogTrendPoint] = Field(default_factory=list)
    ai_suggestions: list[BlogAiSuggestion] = Field(default_factory=list)
    calendar: list[BlogCalendarDay] = Field(default_factory=list)
    source: str = "backend"


class BlogPostCreateRequest(BaseModel):
    title: str
    slug: str
    excerpt: str | None = None
    content: str | None = ""
    category_id: str | None = None
    author_id: str | None = None
    featured_image: str | None = None


class BlogPostUpdateRequest(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    status: str | None = None
    category_id: str | None = None
    content_blocks: list[dict] | None = None


class BlogScheduleRequest(BaseModel):
    scheduled_at: str


class BlogAIGenerateRequest(BaseModel):
    topic: str
    language: str = "fr"


class BlogAIGenerateResponse(BaseModel):
    title: str
    outline: list[str]
    content: str
    faq: list[dict]
    seo: dict
    cta: dict


class BlogSEOAuditRequest(BaseModel):
    post_id: str


class BlogSEOAuditResponse(BaseModel):
    post_id: str
    score: int
    checklist: list[dict]
    recommendations: list[str]


class BlogPostDetailResponse(BlogPostListItem):
    content: str
    reading_time: int
    content_blocks: list[dict] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    seo: dict = Field(default_factory=dict)
    revisions: list[dict] = Field(default_factory=list)
    related_posts: list[dict] = Field(default_factory=list)
    ai_content: dict = Field(default_factory=dict)
