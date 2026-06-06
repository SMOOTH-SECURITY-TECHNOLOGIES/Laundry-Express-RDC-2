from typing import List, Optional

from pydantic import BaseModel, Field


class TwoFactorToggleRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class TwoFactorToggleResponse(BaseModel):
    success: bool
    message: str


class PartnerSecurityActivityLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    created_at: str
    updated_at: str


class PartnerSecurityActivityLogListResponse(BaseModel):
    logs: List[PartnerSecurityActivityLogResponse]
    total: int
    limit: int
