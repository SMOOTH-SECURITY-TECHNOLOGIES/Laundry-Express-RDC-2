"""create rbac tables

Revision ID: v6w7x8y9z0a1
Revises: u5v6w7x8y9z0
Create Date: 2026-06-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "v6w7x8y9z0a1"
down_revision = "u5v6w7x8y9z0"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("rbac_roles", *_base(),
        sa.Column("slug", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("user_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("permissions_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at_label", sa.String(32), nullable=True),
        sa.Column("is_system", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
    )
    op.create_index("ix_rbac_roles_slug", "rbac_roles", ["slug"], unique=True)
    op.create_index("ix_rbac_roles_tenant_id", "rbac_roles", ["tenant_id"])

    op.create_table("rbac_permissions", *_base(),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("module", sa.String(64), nullable=False),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("label", sa.String(128), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("risk_level", sa.String(32), server_default="low", nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )
    op.create_index("ix_rbac_permissions_slug", "rbac_permissions", ["slug"], unique=True)
    op.create_index("ix_rbac_permissions_module", "rbac_permissions", ["module"])

    op.create_table("rbac_role_permissions", *_base(),
        sa.Column("role_slug", sa.String(64), nullable=False),
        sa.Column("permission_slug", sa.String(128), nullable=False),
        sa.Column("access_level", sa.String(32), server_default="allowed", nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )
    op.create_index("ix_rbac_role_permissions_role", "rbac_role_permissions", ["role_slug"])

    op.create_table("rbac_user_roles", *_base(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_name", sa.String(128), nullable=False),
        sa.Column("user_email", sa.String(255), nullable=False),
        sa.Column("role_slug", sa.String(64), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=True),
        sa.Column("last_login_at", sa.String(64), nullable=True),
        sa.Column("two_fa_enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
    )
    op.create_index("ix_rbac_user_roles_email", "rbac_user_roles", ["user_email"])

    op.create_table("rbac_user_permissions", *_base(),
        sa.Column("user_email", sa.String(255), nullable=False),
        sa.Column("permission_slug", sa.String(128), nullable=False),
        sa.Column("grant_type", sa.String(32), server_default="custom", nullable=False),
        sa.Column("access_level", sa.String(32), server_default="allowed", nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )
    op.create_index("ix_rbac_user_permissions_email", "rbac_user_permissions", ["user_email"])

    op.create_table("rbac_permission_exceptions", *_base(),
        sa.Column("user_email", sa.String(255), nullable=False),
        sa.Column("permission_slug", sa.String(128), nullable=False),
        sa.Column("exception_type", sa.String(32), server_default="grant", nullable=False),
        sa.Column("reason", sa.String(255), nullable=True),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )

    op.create_table("rbac_temporary_permissions", *_base(),
        sa.Column("user_email", sa.String(255), nullable=False),
        sa.Column("permission_slug", sa.String(128), nullable=False),
        sa.Column("granted_by", sa.String(128), nullable=True),
        sa.Column("expires_at", sa.String(64), nullable=True),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )

    op.create_table("rbac_permission_audit_logs", *_base(),
        sa.Column("actor_name", sa.String(128), nullable=False),
        sa.Column("actor_email", sa.String(255), nullable=True),
        sa.Column("permission_slug", sa.String(128), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("old_value", sa.String(64), nullable=True),
        sa.Column("new_value", sa.String(64), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("occurred_at", sa.String(64), nullable=True),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )

    op.create_table("rbac_permission_history", *_base(),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("event_label", sa.String(128), nullable=False),
        sa.Column("actor_name", sa.String(128), nullable=False),
        sa.Column("target", sa.String(255), nullable=True),
        sa.Column("occurred_at", sa.String(64), nullable=True),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )

    op.create_table("rbac_risk_alerts", *_base(),
        sa.Column("alert_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(32), server_default="info", nullable=False),
        sa.Column("user_email", sa.String(255), nullable=True),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )

    op.create_table("rbac_security_policies", *_base(),
        sa.Column("policy_key", sa.String(64), nullable=False),
        sa.Column("policy_value", sa.Text(), nullable=True),
        sa.Column("enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=True),
    )
    op.create_index("ix_rbac_security_policies_key", "rbac_security_policies", ["policy_key"], unique=True)

    op.create_table("rbac_tenants", *_base(),
        sa.Column("slug", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("user_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("role_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
    )
    op.create_index("ix_rbac_tenants_slug", "rbac_tenants", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_rbac_tenants_slug", table_name="rbac_tenants")
    op.drop_table("rbac_tenants")
    op.drop_index("ix_rbac_security_policies_key", table_name="rbac_security_policies")
    op.drop_table("rbac_security_policies")
    op.drop_table("rbac_risk_alerts")
    op.drop_table("rbac_permission_history")
    op.drop_table("rbac_permission_audit_logs")
    op.drop_table("rbac_temporary_permissions")
    op.drop_table("rbac_permission_exceptions")
    op.drop_index("ix_rbac_user_permissions_email", table_name="rbac_user_permissions")
    op.drop_table("rbac_user_permissions")
    op.drop_index("ix_rbac_user_roles_email", table_name="rbac_user_roles")
    op.drop_table("rbac_user_roles")
    op.drop_index("ix_rbac_role_permissions_role", table_name="rbac_role_permissions")
    op.drop_table("rbac_role_permissions")
    op.drop_index("ix_rbac_permissions_module", table_name="rbac_permissions")
    op.drop_index("ix_rbac_permissions_slug", table_name="rbac_permissions")
    op.drop_table("rbac_permissions")
    op.drop_index("ix_rbac_roles_tenant_id", table_name="rbac_roles")
    op.drop_index("ix_rbac_roles_slug", table_name="rbac_roles")
    op.drop_table("rbac_roles")
