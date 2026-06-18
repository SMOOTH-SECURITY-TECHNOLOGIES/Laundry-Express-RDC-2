"""create_vehicles_table

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7
Create Date: 2026-06-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c1d2e3f4a5b6'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    vehicletype = sa.Enum('MOTO', 'CAR', 'VAN', name='vehicletype')
    vehicletype.create(op.get_bind(), checkfirst=True)

    vehiclestatus = sa.Enum('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'FAILED', 'CANCELLED', name='vehiclestatus')
    vehiclestatus.create(op.get_bind(), checkfirst=True)

    vehiclemaintenancestatus = sa.Enum('OK', 'SCHEDULED', 'IN_PROGRESS', 'OVERDUE', name='vehiclemaintenancestatus')
    vehiclemaintenancestatus.create(op.get_bind(), checkfirst=True)

    op.execute("""
        CREATE TABLE IF NOT EXISTS vehicles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plate VARCHAR(50) NOT NULL UNIQUE,
            type vehicletype NOT NULL,
            status vehiclestatus NOT NULL DEFAULT 'PENDING',
            driver_id UUID REFERENCES drivers(id),
            assigned_driver_name VARCHAR(200),
            zone VARCHAR(100),
            location VARCHAR(200),
            last_known_location VARCHAR(200),
            mileage_km INTEGER NOT NULL DEFAULT 0,
            insurance_expires_at TIMESTAMPTZ,
            maintenance_status vehiclemaintenancestatus NOT NULL DEFAULT 'OK',
            maintenance_next_service_km INTEGER NOT NULL DEFAULT 0,
            maintenance_notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.create_index(op.f('ix_vehicles_plate'), 'vehicles', ['plate'], unique=True)
    op.create_index(op.f('ix_vehicles_driver_id'), 'vehicles', ['driver_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_vehicles_driver_id'), table_name='vehicles')
    op.drop_index(op.f('ix_vehicles_plate'), table_name='vehicles')
    op.execute("DROP TABLE IF EXISTS vehicles")
    op.execute("DROP TYPE IF EXISTS vehiclemaintenancestatus")
    op.execute("DROP TYPE IF EXISTS vehiclestatus")
    op.execute("DROP TYPE IF EXISTS vehicletype")
