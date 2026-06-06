from sqlalchemy import Boolean, Column, String, Text

from app.models.base import BaseModel


class AdvertisementConfig(BaseModel):
    __tablename__ = "advertisement_configs"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(Text, nullable=False)
    link_url = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
