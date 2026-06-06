from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProofType(str, Enum):
    PHOTO = "photo"
    SIGNATURE = "signature"
    GEOLOCATION = "geolocation"
    WEBHOOK = "webhook"
    SYSTEM = "system"
    MANUAL = "manual"


class ActorType(str, Enum):
    CUSTOMER = "customer"
    DRIVER = "driver"
    PARTNER = "partner"
    SYSTEM = "system"
    ADMIN = "admin"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISPUTED = "disputed"
    REJECTED = "rejected"


class TimelineEventType(str, Enum):
    STATUS_CHANGE = "status_change"
    PAYMENT = "payment"
    PROOF_ADDED = "proof_added"
    DISPUTE = "dispute"
    MESSAGE = "message"
    REFUND = "refund"
    COMMISSION = "commission"


class CorridorType(str, Enum):
    ORDER = "order"
    PAYMENT = "payment"
    LOGISTICS = "logistics"


class AnomalyType(str, Enum):
    PAYMENT_MISMATCH = "payment_mismatch"
    DELIVERED_WITHOUT_PROOF = "delivered_without_proof"
    DUPLICATE_DELIVERY_TASK = "duplicate_delivery_task"
    TRANSITION_REJECTED = "transition_rejected"
    RACE_BLOCKED = "race_blocked"
    WEBHOOK_DUPLICATE = "webhook_duplicate"
    COMMISSION_DUPLICATE = "commission_duplicate"
    MISSING_PROOF = "missing_proof"


class CorridorHealthStatus(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


class ProofResponse(BaseModel):
    id: UUID
    order_id: UUID
    task_id: Optional[UUID]
    proof_type: str
    proof_data: dict
    actor_type: str
    actor_id: UUID
    actor_name: str
    recorded_at: datetime
    verified_at: Optional[datetime]
    location_lat: Optional[Decimal]
    location_lng: Optional[Decimal]
    location_accuracy: Optional[Decimal]
    verification_status: str
    verification_method: Optional[str]
    verification_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TimelineEventResponse(BaseModel):
    id: UUID
    order_id: UUID
    task_id: Optional[UUID]
    event_type: str
    event_subtype: Optional[str]
    from_status: Optional[str]
    to_status: Optional[str]
    payload: dict
    occurred_at: datetime
    source: str
    correlation_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TruthTimelineResponse(BaseModel):
    order_id: UUID
    order_number: str
    customer_id: UUID
    partner_id: UUID
    current_status: str
    version: int
    events: List[TimelineEventResponse]
    proofs: List[ProofResponse]


class CorridorHealthItem(BaseModel):
    corridor: str
    status: str
    open_anomalies: int
    last_event_at: Optional[datetime]
    risk_level: str


class CorridorHealthResponse(BaseModel):
    corridors: List[CorridorHealthItem]
    checked_at: datetime


class AnomalyResponse(BaseModel):
    id: UUID
    anomaly_type: str
    corridor: str
    order_id: Optional[UUID]
    payment_intent_id: Optional[UUID]
    task_id: Optional[UUID]
    description: str
    severity: str
    detected_at: datetime
    resolved_at: Optional[datetime]
    payload: dict

    class Config:
        from_attributes = True


class AnomalyListResponse(BaseModel):
    anomalies: List[AnomalyResponse]
    total: int
    page: int
    page_size: int


class InvestigationResult(BaseModel):
    order: Optional[dict]
    payment_intent: Optional[dict]
    delivery_tasks: List[dict]
    timelines: List[TimelineEventResponse]
    proofs: List[ProofResponse]
    status_history: List[dict]
    anomalies: List[AnomalyResponse]
    summary: dict