from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class SupportMessageResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    user_id: UUID
    content: str
    is_internal: bool
    attachments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupportTicketResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    title: str
    description: str
    status: str
    priority: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    assigned_to: Optional[UUID] = None
    response_time_minutes: Optional[int] = None
    resolution_time_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    messages: List[SupportMessageResponse] = []

    class Config:
        from_attributes = True

