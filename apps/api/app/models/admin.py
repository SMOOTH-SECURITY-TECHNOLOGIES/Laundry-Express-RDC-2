import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel


class AuditAction(str, Enum):
    """Actions d'audit"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PERMISSION_CHANGE = "permission_change"


class AuditLog(BaseModel):
    """Journal d'audit"""
    __tablename__ = "audit_logs"

    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Action
    action = Column(String(50), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Détails
    details = Column(Text, nullable=True)  # JSON
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action={self.action})>"


class AdminNote(BaseModel):
    """Note administrative"""
    __tablename__ = "admin_notes"

    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    admin_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Contenu
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    
    # Catégorisation
    category = Column(String(100), nullable=True)
    is_important = Column(Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f"<AdminNote(id={self.id}, user_id={self.user_id}, title={self.title})>"