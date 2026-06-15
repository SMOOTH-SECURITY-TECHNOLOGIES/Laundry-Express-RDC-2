"""merge ad analytics and notifications heads

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6, notifications_event_pipeline
Create Date: 2026-06-09 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "h2i3j4k5l6m7"
down_revision: Union[str, Sequence[str], None] = (
    "g1h2i3j4k5l6",
    "notifications_event_pipeline",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
