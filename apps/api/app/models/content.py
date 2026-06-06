from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import BaseModel


class SiteContentConfig(BaseModel):
    __tablename__ = "site_content_configs"

    key = Column(String(100), nullable=False, unique=True, index=True)
    content_data = Column(JSONB, nullable=False, default=dict)
