from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.partner import Partner, PartnerLocation, PartnerOperatingHours
from app.schemas.partner_profile import (
    PartnerProfileDayHours,
    PartnerProfileDetailResponse,
    PartnerProfileUpdateRequest,
    PartnerProfileWorkingHours,
    PartnerProfileWorkingHoursUpdateRequest,
)


DAY_NAMES = {
    0: "monday",
    1: "tuesday",
    2: "wednesday",
    3: "thursday",
    4: "friday",
    5: "saturday",
    6: "sunday",
}


class PartnerProfileService:
    """Profil partenaire canonique pour la surface de gestion."""

    def __init__(self, db: Session):
        self.db = db

    def get_partner_profile_detail(self, partner_id: UUID) -> PartnerProfileDetailResponse:
        partner = self._get_partner_or_raise(partner_id)
        primary_location = self._get_primary_location(partner)

        return PartnerProfileDetailResponse(
            id=str(partner.id),
            name=partner.name,
            business_name=partner.business_name,
            email=partner.email,
            phone=partner.phone,
            status=partner.status,
            is_featured=partner.is_featured,
            is_accepting_orders=partner.is_accepting_orders,
            address=self._format_location(primary_location),
            city=primary_location.city if primary_location else None,
            commune=primary_location.commune if primary_location else None,
            video_url=None,
            service_count=sum(1 for service in partner.services if service.is_available),
            working_hours=self._build_working_hours(partner.operating_hours),
        )

    def update_partner_profile_detail(
        self,
        partner_id: UUID,
        payload: PartnerProfileUpdateRequest,
    ) -> PartnerProfileDetailResponse:
        partner = self._get_partner_or_raise(partner_id)
        primary_location = self._get_or_create_primary_location(partner)

        partner.name = payload.name.strip()
        primary_location.address_line_1 = payload.address.strip()
        primary_location.address_line_2 = None
        if payload.city:
            primary_location.city = payload.city.strip()
        if payload.commune:
            primary_location.commune = payload.commune.strip()

        self.db.add(partner)
        self.db.add(primary_location)
        self.db.commit()
        self.db.refresh(partner)

        return self.get_partner_profile_detail(partner_id)

    def update_partner_working_hours(
        self,
        partner_id: UUID,
        payload: PartnerProfileWorkingHoursUpdateRequest,
    ) -> PartnerProfileDetailResponse:
        partner = self._get_partner_or_raise(partner_id)
        existing_by_day = {entry.day_of_week: entry for entry in partner.operating_hours}

        for day_index, day_name in DAY_NAMES.items():
            day_hours = getattr(payload.working_hours, day_name)
            entry = existing_by_day.get(day_index)
            if entry is None:
                entry = PartnerOperatingHours(
                    partner_id=partner.id,
                    day_of_week=day_index,
                )

            entry.opens_at = day_hours.open
            entry.closes_at = day_hours.close
            entry.is_closed = day_hours.is_closed
            self.db.add(entry)

        self.db.commit()
        return self.get_partner_profile_detail(partner_id)

    def _get_partner_or_raise(self, partner_id: UUID) -> Partner:
        partner = (
            self.db.query(Partner)
            .options(
                joinedload(Partner.locations),
                joinedload(Partner.operating_hours),
                joinedload(Partner.services),
            )
            .filter(Partner.id == partner_id)
            .first()
        )
        if not partner:
            raise ValueError("Partenaire introuvable")

        return partner

    @staticmethod
    def _get_primary_location(partner: Partner) -> PartnerLocation | None:
        primary_location = next((location for location in partner.locations if location.is_primary), None)
        if primary_location is None and partner.locations:
            primary_location = partner.locations[0]
        return primary_location

    @staticmethod
    def _get_or_create_primary_location(partner: Partner) -> PartnerLocation:
        primary_location = PartnerProfileService._get_primary_location(partner)
        if primary_location:
            return primary_location

        return PartnerLocation(
            partner_id=partner.id,
            address_line_1="",
            city="Kinshasa",
            commune="Gombe",
            latitude=0.0,
            longitude=0.0,
            is_primary=True,
            is_active=True,
        )

    @staticmethod
    def _format_location(location: PartnerLocation | None) -> str:
        if not location:
            return ""
        parts = [
            location.address_line_1,
            location.address_line_2,
            location.commune,
            location.city,
        ]
        return ", ".join(part for part in parts if part)

    @staticmethod
    def _build_working_hours(operating_hours: list[PartnerOperatingHours]) -> PartnerProfileWorkingHours:
        defaults = {
            name: PartnerProfileDayHours(open="09:00", close="18:00", is_closed=True)
            for name in DAY_NAMES.values()
        }

        for entry in operating_hours or []:
            day_name = DAY_NAMES.get(entry.day_of_week)
            if not day_name:
                continue
            defaults[day_name] = PartnerProfileDayHours(
                open=entry.opens_at,
                close=entry.closes_at,
                is_closed=bool(entry.is_closed),
            )

        return PartnerProfileWorkingHours(**defaults)
