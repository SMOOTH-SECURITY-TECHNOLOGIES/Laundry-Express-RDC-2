from pydantic import BaseModel, Field


class PublicBlogPostItem(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    author_name: str
    author_avatar: str | None = None
    category: str
    category_color: str
    reading_time: int = 5
    views_count: int = 0
    published_at: str | None = None
    featured_image: str | None = None


class PublicBlogPostDetail(PublicBlogPostItem):
    content: str = ""
    tags: list[str] = Field(default_factory=list)
    seo_title: str | None = None
    seo_description: str | None = None


class PublicBlogListResponse(BaseModel):
    posts: list[PublicBlogPostItem]
    categories: list[dict]
    source: str = "backend"
