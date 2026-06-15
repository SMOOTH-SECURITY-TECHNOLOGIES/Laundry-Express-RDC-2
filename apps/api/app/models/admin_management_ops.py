from sqlalchemy import Boolean, Column, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import BaseModel


class AdminMgmtUser(BaseModel):
    __tablename__ = "admin_management_users"

    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(32), nullable=True)
    role_slug = Column(String(64), nullable=False, default="admin")
    status = Column(String(32), nullable=False, default="active")
    two_fa_enabled = Column(Boolean, nullable=False, default=False)
    avatar_url = Column(String(512), nullable=True)
    last_login_at = Column(String(64), nullable=True)


class AdminMgmtRole(BaseModel):
    __tablename__ = "admin_management_roles"

    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(String(255), nullable=True)
    user_count = Column(Integer, nullable=False, default=0)
    permissions_count = Column(Integer, nullable=False, default=0)
    created_at_label = Column(String(32), nullable=True)


class AdminMgmtPermission(BaseModel):
    __tablename__ = "admin_management_permissions"

    slug = Column(String(128), unique=True, nullable=False)
    resource = Column(String(64), nullable=False)
    action = Column(String(32), nullable=False)
    label = Column(String(128), nullable=False)


class AdminMgmtRolePermission(BaseModel):
    __tablename__ = "admin_management_role_permissions"

    role_slug = Column(String(64), nullable=False, index=True)
    permission_slug = Column(String(128), nullable=False, index=True)
    granted = Column(Boolean, nullable=False, default=True)


class AdminMgmtInvitation(BaseModel):
    __tablename__ = "admin_management_invitations"

    email = Column(String(255), nullable=False, index=True)
    role_slug = Column(String(64), nullable=False)
    invited_by = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="pending")
    expires_at = Column(String(64), nullable=True)


class AdminMgmtSession(BaseModel):
    __tablename__ = "admin_management_sessions"

    user_name = Column(String(128), nullable=False)
    user_email = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=True)
    city = Column(String(128), nullable=True)
    device = Column(String(128), nullable=True)
    browser = Column(String(128), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    last_seen_at = Column(String(64), nullable=True)


class AdminMgmtActivityLog(BaseModel):
    __tablename__ = "admin_management_activity_logs"

    actor_name = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)
    action_label = Column(String(128), nullable=False)
    target = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    result = Column(String(32), nullable=False, default="success")
    occurred_at = Column(String(64), nullable=True)


class AdminMgmtAuditLog(BaseModel):
    __tablename__ = "admin_management_audit_logs"

    actor_name = Column(String(128), nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    old_state = Column(JSONB, nullable=True)
    new_state = Column(JSONB, nullable=True)
    occurred_at = Column(String(64), nullable=True)


class AdminMgmtSecurityAlert(BaseModel):
    __tablename__ = "admin_management_security_alerts"

    alert_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="info")
    count = Column(Integer, nullable=False, default=1)
