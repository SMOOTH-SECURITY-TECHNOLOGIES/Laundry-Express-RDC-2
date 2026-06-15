from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SupportTicketCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=3)
    category: Optional[str] = None
    priority: Optional[str] = "medium"
    order_id: Optional[UUID] = None


class SupportMessageCreateRequest(BaseModel):
    content: str = Field(min_length=1)


class SupportAttachmentCreateRequest(BaseModel):
    file_url: str = Field(min_length=3, max_length=1024)
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    size: Optional[int] = Field(default=None, ge=0)


class SupportAttachmentResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    uploaded_by: UUID
    file_url: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerSupportMessageResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    user_id: UUID
    content: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerSupportTicketResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: str
    status: str
    priority: str
    category: Optional[str] = None
    order_id: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    order_number: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[CustomerSupportMessageResponse] = []
    attachments: List[SupportAttachmentResponse] = []

    class Config:
        from_attributes = True


class CustomerClaimCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=3)
    type: str = "other"
    order_id: Optional[UUID] = None


class CustomerClaimResponse(BaseModel):
    id: UUID
    claim_number: str
    customer_id: UUID
    order_id: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    order_number: Optional[str] = None
    payment_status: Optional[str] = None
    type: str
    priority: str
    status: str
    title: str
    description: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
