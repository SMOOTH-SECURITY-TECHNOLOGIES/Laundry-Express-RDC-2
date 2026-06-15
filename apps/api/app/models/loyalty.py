from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel


class LoyaltySettingsConfig(BaseModel):
    __tablename__ = "loyalty_settings_configs"

    key = Column(String(100), nullable=False, unique=True, index=True)
    is_enabled = Column(Boolean, nullable=False, default=True)
    points_per_dollar = Column(Integer, nullable=False, default=10)
    points_to_dollar = Column(Integer, nullable=False, default=100)
    points_expiry_days = Column(Integer, nullable=True)
    redemption_cap = Column(Integer, nullable=True)
    first_order_bonus = Column(Integer, nullable=False, default=200)


class LoyaltyReward(BaseModel):
    __tablename__ = "loyalty_rewards"

    name = Column(String(255), nullable=False)
    points_required = Column(Integer, nullable=False)
    value_dollars = Column(Numeric(10, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    uses_count = Column(Integer, nullable=False, default=0)


class LoyaltyLedgerEntry(BaseModel):
    __tablename__ = "loyalty_ledger_entries"

    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    entry_type = Column(String(50), nullable=False, index=True)
    points_delta = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    description = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    expired_at = Column(DateTime(timezone=True), nullable=True, index=True)
