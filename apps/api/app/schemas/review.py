from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ReviewCreateRequest(BaseModel):
    order_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)
    title: Optional[str] = Field(default=None, max_length=255)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class ReviewResponse(BaseModel):
    id: UUID
    order_id: UUID
    user_id: UUID
    partner_id: UUID
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    status: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    order_number: Optional[str] = None
    partner_name: Optional[str] = None
    customer_first_name: Optional[str] = None

    class Config:
        from_attributes = True
