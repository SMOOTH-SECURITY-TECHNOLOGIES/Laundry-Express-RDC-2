import json
from enum import Enum

from sqlalchemy import Boolean, Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel


class PromoDiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class PromoCode(BaseModel):
    __tablename__ = "promo_codes"

    code = Column(String(100), nullable=False, unique=True, index=True)
    discount_type = Column(String(20), nullable=False, default=PromoDiscountType.PERCENTAGE.value)
    discount_value = Column(Numeric(10, 2), nullable=False)
    min_order_value = Column(Numeric(10, 2), nullable=True)
    is_for_new_users_only = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    usage_count = Column(Integer, nullable=False, default=0)
    max_usage = Column(Integer, nullable=True)
    usage_limit_per_customer = Column(Integer, nullable=True)

    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)

    applicable_services = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    geographic_restrictions = Column(Text, nullable=True)

    @property
    def applicable_services_list(self):
        if not self.applicable_services:
            return []
        try:
            return json.loads(self.applicable_services)
        except json.JSONDecodeError:
            return []

    @property
    def geographic_restrictions_list(self):
        if not self.geographic_restrictions:
            return []
        try:
            return json.loads(self.geographic_restrictions)
        except json.JSONDecodeError:
            return []
