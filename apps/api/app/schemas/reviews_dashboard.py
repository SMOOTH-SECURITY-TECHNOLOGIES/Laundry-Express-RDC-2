from pydantic import BaseModel, Field


class ReviewsKpiResponse(BaseModel):
    avg_rating: float = 0
    avg_rating_change: float = 0
    avg_rating_sparkline: list[float] = Field(default_factory=list)
    total_reviews: int = 0
    total_reviews_change: float = 0
    total_reviews_sparkline: list[int] = Field(default_factory=list)
    five_star: int = 0
    five_star_change: float = 0
    five_star_sparkline: list[int] = Field(default_factory=list)
    low_star: int = 0
    low_star_change: float = 0
    low_star_sparkline: list[int] = Field(default_factory=list)
    response_rate: float = 0
    response_rate_change: float = 0
    response_rate_sparkline: list[float] = Field(default_factory=list)
    pending_reviews: int = 0
    pending_reviews_change: float = 0
    pending_reviews_sparkline: list[int] = Field(default_factory=list)
    positive_sentiment: float = 0
    positive_sentiment_change: float = 0
    positive_sentiment_sparkline: list[float] = Field(default_factory=list)
    churn_risk: int = 0
    churn_risk_change: float = 0
    churn_risk_sparkline: list[int] = Field(default_factory=list)


class ReviewListItemResponse(BaseModel):
    id: str
    client_name: str
    client_id: str
    review_type: str
    review_type_label: str
    rating: int
    comment: str
    source: str
    date: str | None
    status: str
    status_label: str
    partner_name: str | None = None
    order_id: str | None = None


class ReviewDetailResponse(ReviewListItemResponse):
    title: str | None = None
    driver_name: str | None = None
    ai_summary: str = ""
    sentiment: str = "Neutre"
    churn_risk: str = "low"
    priority: str = "medium"
    recommendation: str = ""
    previous_replies: list[str] = Field(default_factory=list)


class RatingDistributionResponse(BaseModel):
    stars: int
    count: int
    percent: float
    change: float
    color: str


class ChannelDistributionResponse(BaseModel):
    channel: str
    count: int
    percent: float
    color: str


class ReviewTypeBreakdownResponse(BaseModel):
    review_type: str
    count: int
    avg_rating: float
    percent: float


class TopPartnerResponse(BaseModel):
    partner_id: str
    partner_name: str
    avg_rating: float
    review_count: int


class TopDriverResponse(BaseModel):
    driver_id: str
    driver_name: str
    avg_rating: float
    review_count: int


class NegativeReviewResponse(BaseModel):
    id: str
    author: str
    problem: str
    date: str | None
    priority: str


class SentimentBreakdownResponse(BaseModel):
    sentiment: str
    count: int
    percent: float
    color: str


class IssueResponse(BaseModel):
    issue: str
    tickets: int
    variation: float
    impact: str


class AgentPerformanceResponse(BaseModel):
    agent_id: str
    agent_name: str
    reviews_handled: int
    avg_response_minutes: int
    satisfaction: float


class AiInsightResponse(BaseModel):
    id: str
    text: str
    category: str


class WordCloudItemResponse(BaseModel):
    word: str
    weight: int
    color: str


class TrendPointResponse(BaseModel):
    date: str
    avg_rating: float
    volume: int


class ReviewsDashboardResponse(BaseModel):
    kpis: ReviewsKpiResponse
    reviews: list[ReviewListItemResponse] = Field(default_factory=list)
    rating_distribution: list[RatingDistributionResponse] = Field(default_factory=list)
    channels: list[ChannelDistributionResponse] = Field(default_factory=list)
    review_types: list[ReviewTypeBreakdownResponse] = Field(default_factory=list)
    top_partners: list[TopPartnerResponse] = Field(default_factory=list)
    top_drivers: list[TopDriverResponse] = Field(default_factory=list)
    negative_queue: list[NegativeReviewResponse] = Field(default_factory=list)
    sentiment: list[SentimentBreakdownResponse] = Field(default_factory=list)
    issues: list[IssueResponse] = Field(default_factory=list)
    agents: list[AgentPerformanceResponse] = Field(default_factory=list)
    insights: list[AiInsightResponse] = Field(default_factory=list)
    word_cloud: list[WordCloudItemResponse] = Field(default_factory=list)
    trends: list[TrendPointResponse] = Field(default_factory=list)
    source: str = "backend"


class ReviewReplyRequest(BaseModel):
    content: str


class ReviewsExportRequest(BaseModel):
    format: str = "csv"
    scope: str = "reviews"
