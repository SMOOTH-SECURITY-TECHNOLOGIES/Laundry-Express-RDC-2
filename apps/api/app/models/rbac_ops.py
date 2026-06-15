from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import BaseModel


class RbacRole(BaseModel):
    __tablename__ = "rbac_roles"

    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(String(255), nullable=True)
    user_count = Column(Integer, nullable=False, default=0)
    permissions_count = Column(Integer, nullable=False, default=0)
    created_at_label = Column(String(32), nullable=True)
    is_system = Column(Boolean, nullable=False, default=False)
    tenant_id = Column(String(64), nullable=True, index=True)
    status = Column(String(32), nullable=False, default="active")


class RbacPermission(BaseModel):
    __tablename__ = "rbac_permissions"

    slug = Column(String(128), unique=True, nullable=False)
    module = Column(String(64), nullable=False, index=True)
    action = Column(String(32), nullable=False)
    label = Column(String(128), nullable=False)
    description = Column(String(255), nullable=True)
    risk_level = Column(String(32), nullable=False, default="low")
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacRolePermission(BaseModel):
    __tablename__ = "rbac_role_permissions"

    role_slug = Column(String(64), nullable=False, index=True)
    permission_slug = Column(String(128), nullable=False, index=True)
    access_level = Column(String(32), nullable=False, default="allowed")
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacUserRole(BaseModel):
    __tablename__ = "rbac_user_roles"

    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    user_name = Column(String(128), nullable=False)
    user_email = Column(String(255), nullable=False, index=True)
    role_slug = Column(String(64), nullable=False, index=True)
    tenant_id = Column(String(64), nullable=True, index=True)
    last_login_at = Column(String(64), nullable=True)
    two_fa_enabled = Column(Boolean, nullable=False, default=False)
    status = Column(String(32), nullable=False, default="active")


class RbacUserPermission(BaseModel):
    __tablename__ = "rbac_user_permissions"

    user_email = Column(String(255), nullable=False, index=True)
    permission_slug = Column(String(128), nullable=False, index=True)
    grant_type = Column(String(32), nullable=False, default="custom")
    access_level = Column(String(32), nullable=False, default="allowed")
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacPermissionException(BaseModel):
    __tablename__ = "rbac_permission_exceptions"

    user_email = Column(String(255), nullable=False, index=True)
    permission_slug = Column(String(128), nullable=False)
    exception_type = Column(String(32), nullable=False, default="grant")
    reason = Column(String(255), nullable=True)
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacTemporaryPermission(BaseModel):
    __tablename__ = "rbac_temporary_permissions"

    user_email = Column(String(255), nullable=False, index=True)
    permission_slug = Column(String(128), nullable=False)
    granted_by = Column(String(128), nullable=True)
    expires_at = Column(String(64), nullable=True)
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacPermissionAuditLog(BaseModel):
    __tablename__ = "rbac_permission_audit_logs"

    actor_name = Column(String(128), nullable=False)
    actor_email = Column(String(255), nullable=True)
    permission_slug = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)
    old_value = Column(String(64), nullable=True)
    new_value = Column(String(64), nullable=True)
    ip_address = Column(String(45), nullable=True)
    occurred_at = Column(String(64), nullable=True)
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacPermissionHistory(BaseModel):
    __tablename__ = "rbac_permission_history"

    event_type = Column(String(64), nullable=False)
    event_label = Column(String(128), nullable=False)
    actor_name = Column(String(128), nullable=False)
    target = Column(String(255), nullable=True)
    occurred_at = Column(String(64), nullable=True)
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacRiskAlert(BaseModel):
    __tablename__ = "rbac_risk_alerts"

    alert_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="info")
    user_email = Column(String(255), nullable=True)
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacSecurityPolicy(BaseModel):
    __tablename__ = "rbac_security_policies"

    policy_key = Column(String(64), unique=True, nullable=False)
    policy_value = Column(Text, nullable=True)
    enabled = Column(Boolean, nullable=False, default=False)
    tenant_id = Column(String(64), nullable=True, index=True)


class RbacTenant(BaseModel):
    __tablename__ = "rbac_tenants"

    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    user_count = Column(Integer, nullable=False, default=0)
    role_count = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="active")
