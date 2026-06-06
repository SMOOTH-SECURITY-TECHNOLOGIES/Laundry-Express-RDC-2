from sqlalchemy import Column, String

from app.models.base import BaseModel


class TrackingSettingsConfig(BaseModel):
    __tablename__ = "tracking_settings_configs"

    key = Column(String(100), nullable=False, unique=True, index=True)
    gtm_container_id = Column(String(100), nullable=False, default="")
    meta_pixel_id = Column(String(100), nullable=False, default="")
