"""create notification event pipeline tables

Revision ID: notifications_event_pipeline
Revises: add_order_version_locking
Create Date: 2026-06-07 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "notifications_event_pipeline"
down_revision = "add_order_version_locking"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    table_names = set(inspector.get_table_names())

    if "notifications" not in table_names:
        op.create_table(
            "notifications",
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("notification_type", sa.String(length=50), nullable=False),
            sa.Column("notification_metadata", sa.Text(), nullable=True),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_notifications_user_id", "notifications", ["user_id"], unique=False)

    if "notification_deliveries" not in table_names:
        op.create_table(
            "notification_deliveries",
            sa.Column("notification_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("channel", sa.String(length=50), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("provider_message_id", sa.String(length=255), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["notification_id"], ["notifications.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_notification_deliveries_notification_id", "notification_deliveries", ["notification_id"], unique=False)

    if "notification_templates" not in table_names:
        op.create_table(
            "notification_templates",
            sa.Column("template_name", sa.String(length=100), nullable=False),
            sa.Column("notification_type", sa.String(length=50), nullable=False),
            sa.Column("channel", sa.String(length=50), nullable=False),
            sa.Column("subject", sa.String(length=255), nullable=True),
            sa.Column("title", sa.String(length=255), nullable=True),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("variables", sa.Text(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_notification_templates_template_name", "notification_templates", ["template_name"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_notification_templates_template_name", table_name="notification_templates")
    op.drop_table("notification_templates")
    op.drop_index("ix_notification_deliveries_notification_id", table_name="notification_deliveries")
    op.drop_table("notification_deliveries")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")
