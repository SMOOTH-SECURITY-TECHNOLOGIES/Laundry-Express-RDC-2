"""merge marketplace and loyalty heads

Revision ID: f9a0b1c2d3e4
Revises: a7b8c9d0e1f2, c6d7e8f9a0b1
Create Date: 2026-03-19 16:47:00.000000
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f9a0b1c2d3e4"
down_revision: Union[str, Sequence[str], None] = ("a7b8c9d0e1f2", "c6d7e8f9a0b1")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
