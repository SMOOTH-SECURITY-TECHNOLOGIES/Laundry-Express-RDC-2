"""create admin management tables

Revision ID: u5v6w7x8y9z0
Revises: t4u5v6w7x8y9
Create Date: 2026-06-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "u5v6w7x8y9z0"
down_revision = "t4u5v6w7x8y9"
branch_labels = None
depends_on = None


def _base():
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("admin_management_users", *_base(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("role_slug", sa.String(64), server_default="admin", nullable=False),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
        sa.Column("two_fa_enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("last_login_at", sa.String(64), nullable=True),
    )
    op.create_index("ix_admin_management_users_email", "admin_management_users", ["email"])
    op.create_table("admin_management_roles", *_base(),
        sa.Column("slug", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("user_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("permissions_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at_label", sa.String(32), nullable=True),
    )
    op.create_index("ix_admin_management_roles_slug", "admin_management_roles", ["slug"], unique=True)
    op.create_table("admin_management_permissions", *_base(),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("resource", sa.String(64), nullable=False),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("label", sa.String(128), nullable=False),
    )
    op.create_index("ix_admin_management_permissions_slug", "admin_management_permissions", ["slug"], unique=True)
    op.create_table("admin_management_role_permissions", *_base(),
        sa.Column("role_slug", sa.String(64), nullable=False),
        sa.Column("permission_slug", sa.String(128), nullable=False),
        sa.Column("granted", sa.Boolean(), server_default="true", nullable=False),
    )
    op.create_index("ix_admin_management_role_permissions_role", "admin_management_role_permissions", ["role_slug"])
    op.create_table("admin_management_invitations", *_base(),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role_slug", sa.String(64), nullable=False),
        sa.Column("invited_by", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), server_default="pending", nullable=False),
        sa.Column("expires_at", sa.String(64), nullable=True),
    )
    op.create_table("admin_management_sessions", *_base(),
        sa.Column("user_name", sa.String(128), nullable=False),
        sa.Column("user_email", sa.String(255), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("city", sa.String(128), nullable=True),
        sa.Column("device", sa.String(128), nullable=True),
        sa.Column("browser", sa.String(128), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("last_seen_at", sa.String(64), nullable=True),
    )
    op.create_table("admin_management_activity_logs", *_base(),
        sa.Column("actor_name", sa.String(128), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("action_label", sa.String(128), nullable=False),
        sa.Column("target", sa.String(255), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("result", sa.String(32), server_default="success", nullable=False),
        sa.Column("occurred_at", sa.String(64), nullable=True),
    )
    op.create_table("admin_management_audit_logs", *_base(),
        sa.Column("actor_name", sa.String(128), nullable=False),
        sa.Column("resource_type", sa.String(64), nullable=False),
        sa.Column("resource_id", sa.String(64), nullable=True),
        sa.Column("old_state", postgresql.JSONB(), nullable=True),
        sa.Column("new_state", postgresql.JSONB(), nullable=True),
        sa.Column("occurred_at", sa.String(64), nullable=True),
    )
    op.create_table("admin_management_security_alerts", *_base(),
        sa.Column("alert_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(32), server_default="info", nullable=False),
        sa.Column("count", sa.Integer(), server_default="1", nullable=False),
    )


def downgrade() -> None:
    op.drop_table("admin_management_security_alerts")
    op.drop_table("admin_management_audit_logs")
    op.drop_table("admin_management_activity_logs")
    op.drop_table("admin_management_sessions")
    op.drop_table("admin_management_invitations")
    op.drop_index("ix_admin_management_role_permissions_role", table_name="admin_management_role_permissions")
    op.drop_table("admin_management_role_permissions")
    op.drop_index("ix_admin_management_permissions_slug", table_name="admin_management_permissions")
    op.drop_table("admin_management_permissions")
    op.drop_index("ix_admin_management_roles_slug", table_name="admin_management_roles")
    op.drop_table("admin_management_roles")
    op.drop_index("ix_admin_management_users_email", table_name="admin_management_users")
    op.drop_table("admin_management_users")
