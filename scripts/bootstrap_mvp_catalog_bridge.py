from decimal import Decimal
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.models.catalog import PartnerService, PricingMode, ServiceCategory, ServiceType  # noqa: E402
from app.models.partner import Partner, PartnerLocation, PartnerStatus, PartnerType  # noqa: E402


DATABASE_URL = "postgresql://laundry_user:laundry_pass@localhost:5433/laundry_express"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


SERVICE_DEFINITIONS = {
    "Nettoyage à sec standard": {
        "category_name": "General Pressing",
        "category_slug": "general-pressing",
        "type_slug": "nettoyage-a-sec-standard",
        "description": "Nettoyage professionnel pour vos vêtements délicats.",
        "base_price": Decimal("2.50"),
        "pricing_mode": PricingMode.UNIT,
    },
    "Lavage & Pliage": {
        "category_name": "General Laundry",
        "category_slug": "general-laundry",
        "type_slug": "lavage-pliage",
        "description": "Lavage complet, séchage et pliage de vos vêtements quotidiens.",
        "base_price": Decimal("1.50"),
        "pricing_mode": PricingMode.KG,
    },
}

PARTNER_DEFINITIONS = [
    {
        "name": "Prestige Pressing",
        "business_name": "Prestige Pressing",
        "email": "bridge-prestige@laundry.test",
        "phone": "+243810100001",
        "partner_type": PartnerType.PRESSING.value,
        "address_line_1": "123 Av. du 30 Juin",
        "city": "Kinshasa",
        "commune": "Gombe",
        "latitude": -4.316,
        "longitude": 15.308,
        "service_name": "Nettoyage à sec standard",
    },
    {
        "name": "Lavage Express Gombe",
        "business_name": "Lavage Express Gombe",
        "email": "bridge-lavage-gombe@laundry.test",
        "phone": "+243810100002",
        "partner_type": PartnerType.LAUNDRY.value,
        "address_line_1": "45 Blvd Kasa-Vubu",
        "city": "Kinshasa",
        "commune": "Gombe",
        "latitude": -4.321,
        "longitude": 15.312,
        "service_name": "Lavage & Pliage",
    },
    {
        "name": "Clean Chic Pressing",
        "business_name": "Clean Chic Pressing",
        "email": "bridge-clean-chic@laundry.test",
        "phone": "+243810100003",
        "partner_type": PartnerType.PRESSING.value,
        "address_line_1": "12 Av. de l'Equateur",
        "city": "Kinshasa",
        "commune": "Limete",
        "latitude": -4.345,
        "longitude": 15.331,
        "service_name": "Nettoyage à sec standard",
    },
    {
        "name": "Rapido Lavage",
        "business_name": "Rapido Lavage",
        "email": "bridge-rapido@laundry.test",
        "phone": "+243810100004",
        "partner_type": PartnerType.LAUNDRY.value,
        "address_line_1": "Bandal Nord",
        "city": "Kinshasa",
        "commune": "Bandalungwa",
        "latitude": -4.338,
        "longitude": 15.289,
        "service_name": "Lavage & Pliage",
    },
]


def get_or_create_service_category(session, name: str, slug: str, description: str):
    category = session.query(ServiceCategory).filter(ServiceCategory.slug == slug).first()
    if category:
        return category

    category = ServiceCategory(
        name=name,
        slug=slug,
        description=description,
        is_active=True,
    )
    session.add(category)
    session.flush()
    return category


def get_or_create_service_type(session, name: str, slug: str, description: str):
    service_type = session.query(ServiceType).filter(ServiceType.slug == slug).first()
    if service_type:
        return service_type

    service_type = ServiceType(
        name=name,
        slug=slug,
        description=description,
        is_active=True,
    )
    session.add(service_type)
    session.flush()
    return service_type


def get_or_create_partner(session, definition: dict):
    partner = session.query(Partner).filter(Partner.name == definition["name"]).first()
    if not partner:
        partner = Partner(
            name=definition["name"],
            business_name=definition["business_name"],
            tax_id=None,
            partner_type=definition["partner_type"],
            status=PartnerStatus.ACTIVE.value,
            email=definition["email"],
            phone=definition["phone"],
            is_verified=True,
            is_featured=True,
            is_accepting_orders=True,
            rating=4.7,
            total_reviews=50,
            total_orders=0,
        )
        session.add(partner)
        session.flush()

    location = session.query(PartnerLocation).filter(
        PartnerLocation.partner_id == partner.id,
        PartnerLocation.is_primary == True,
    ).first()
    if not location:
        location = PartnerLocation(
            partner_id=partner.id,
            address_line_1=definition["address_line_1"],
            address_line_2=None,
            city=definition["city"],
            commune=definition["commune"],
            zone=None,
            latitude=definition["latitude"],
            longitude=definition["longitude"],
            is_primary=True,
            is_active=True,
        )
        session.add(location)
        session.flush()

    return partner


def ensure_partner_service(session, partner: Partner, service_name: str):
    service_definition = SERVICE_DEFINITIONS[service_name]
    category = get_or_create_service_category(
        session,
        service_definition["category_name"],
        service_definition["category_slug"],
        service_definition["description"],
    )
    service_type = get_or_create_service_type(
        session,
        service_name,
        service_definition["type_slug"],
        service_definition["description"],
    )

    partner_service = session.query(PartnerService).filter(
        PartnerService.partner_id == partner.id,
        PartnerService.service_type_id == service_type.id,
    ).first()
    if partner_service:
        partner_service.service_category_id = category.id
        partner_service.base_price = service_definition["base_price"]
        partner_service.pricing_mode = service_definition["pricing_mode"]
        partner_service.estimated_turnaround_hours = 24
        partner_service.is_available = True
        session.add(partner_service)
        session.flush()
        return partner_service

    partner_service = PartnerService(
        partner_id=partner.id,
        service_category_id=category.id,
        service_type_id=service_type.id,
        base_price=service_definition["base_price"],
        pricing_mode=service_definition["pricing_mode"],
        estimated_turnaround_hours=24,
        is_available=True,
    )
    session.add(partner_service)
    session.flush()
    return partner_service


def main():
    session = SessionLocal()
    try:
        for definition in PARTNER_DEFINITIONS:
            partner = get_or_create_partner(session, definition)
            ensure_partner_service(session, partner, definition["service_name"])

        session.commit()
        print("MVP catalog bridge bootstrapped successfully.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
