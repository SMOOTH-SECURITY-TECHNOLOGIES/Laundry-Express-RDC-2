from sqlalchemy import Boolean, Column, Integer, Numeric, String

from app.models.base import BaseModel


class OrderAddOn(BaseModel):
    __tablename__ = "order_add_ons"

    slug = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=False, default="")
    image_url = Column(String(2048), nullable=False, default="")
    price = Column(Numeric(10, 2), nullable=False, default=0)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
