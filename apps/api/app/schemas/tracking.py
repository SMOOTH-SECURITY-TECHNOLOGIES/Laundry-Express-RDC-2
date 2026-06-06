from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TrackingSettingsPayload(BaseModel):
    gtmContainerId: str = ""
    metaPixelId: str = ""


class TrackingSettingsResponse(BaseModel):
    id: UUID | None = None
    key: str
    gtmContainerId: str
    metaPixelId: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
