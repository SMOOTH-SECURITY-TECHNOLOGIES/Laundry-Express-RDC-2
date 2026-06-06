from decimal import Decimal

from pydantic import BaseModel
from typing import Optional, List


class AdminActivityLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: str
    updated_at: str


class AdminActivityLogListResponse(BaseModel):
    logs: List[AdminActivityLogResponse]
    total: int
    limit: int


class AdminOverviewResponse(BaseModel):
    total_partners: int
    total_users: int
    total_orders: int
    total_drivers: int
    orders_last_30_days: int
    revenue_last_30_days: Decimal
    open_disputes: int
    open_tickets: int
    pending_refunds: int
