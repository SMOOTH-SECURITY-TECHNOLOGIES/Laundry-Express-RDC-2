from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_sync_db,
    user_has_partner_access_sync,
)
from app.models.admin import AuditLog
from app.models.partner import PartnerStaff
from app.models.user import User as UserModel
from app.schemas.order import OrderStatus
from app.models.user import User
from app.schemas.partner_analytics import (
    PartnerAnalyticsRange,
    PartnerAnalyticsSummaryResponse,
)
from app.schemas.dashboard import PartnerDashboardSummaryResponse
from app.schemas.partner_financials import PartnerFinancialSummaryResponse
from app.schemas.partner_invoicing import (
    PartnerGeneratedDocument,
    PartnerInvoiceEligibleOrdersResponse,
    PartnerOrderDocumentsResponse,
)
from app.schemas.partner_profile import (
    PartnerProfileDetailResponse,
    PartnerProfileUpdateRequest,
    PartnerProfileWorkingHoursUpdateRequest,
)
from app.schemas.partner_security import (
    PartnerSecurityActivityLogListResponse,
    PartnerSecurityActivityLogResponse,
)
from app.services.dashboard_service import DashboardService
from app.schemas.partner_orders import PartnerOrdersListResponse
from app.services.partner_analytics_service import PartnerAnalyticsService
from app.services.partner_financial_service import PartnerFinancialService
from app.services.partner_invoicing_service import PartnerInvoicingService
from app.services.partner_orders_service import PartnerOrdersService
from app.services.partner_profile_service import PartnerProfileService

router = APIRouter(prefix="/partners", tags=["partners"])


@router.get("/{partner_id}/dashboard-summary", response_model=PartnerDashboardSummaryResponse)
def get_partner_dashboard_summary(
    partner_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne une source de vérité unique pour le dashboard partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce tableau de bord partenaire",
        )

    service = DashboardService(db)

    try:
        return service.get_partner_dashboard_summary(partner_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du dashboard partenaire",
        ) from exc


@router.get("/{partner_id}/orders", response_model=PartnerOrdersListResponse)
def list_partner_orders(
    partner_id: UUID,
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    status_filter: OrderStatus | None = Query(None, alias="status", description="Filtre par statut"),
    date_from: date | None = Query(None, description="Filtre de date début (création)"),
    date_to: date | None = Query(None, description="Filtre de date fin (création)"),
    search: str | None = Query(None, description="Recherche par numéro, client ou service"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne la liste canonique des commandes d'un partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ces commandes partenaire",
        )

    service = PartnerOrdersService(db)

    try:
        return service.list_partner_orders(
            partner_id,
            status=status_filter,
            page=page,
            page_size=page_size,
            date_from=date_from,
            date_to=date_to,
            search=search,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des commandes partenaire",
        ) from exc


@router.get("/{partner_id}/financial-summary", response_model=PartnerFinancialSummaryResponse)
def get_partner_financial_summary(
    partner_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne la vérité financière canonique d'un partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce résumé financier partenaire",
        )

    service = PartnerFinancialService(db)

    try:
        return service.get_partner_financial_summary(partner_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du résumé financier partenaire",
        ) from exc


@router.get("/{partner_id}/analytics-summary", response_model=PartnerAnalyticsSummaryResponse)
def get_partner_analytics_summary(
    partner_id: UUID,
    range_value: PartnerAnalyticsRange = Query(
        PartnerAnalyticsRange.MONTH,
        alias="range",
        description="Fenêtre analytique: week, month, year",
    ),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne le résumé analytique canonique d'un partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce résumé analytique partenaire",
        )

    service = PartnerAnalyticsService(db)

    try:
        return service.get_partner_analytics_summary(partner_id, range_value)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du résumé analytique partenaire",
        ) from exc


@router.get("/{partner_id}/invoice-eligible-orders", response_model=PartnerInvoiceEligibleOrdersResponse)
def list_partner_invoice_eligible_orders(
    partner_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne les commandes terminées facturables d'un partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ces commandes facturables partenaire",
        )

    service = PartnerInvoicingService(db)
    return service.list_invoice_eligible_orders(partner_id)


@router.get("/{partner_id}/profile-detail", response_model=PartnerProfileDetailResponse)
def get_partner_profile_detail(
    partner_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne le profil partenaire canonique pour la gestion partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce profil partenaire",
        )

    service = PartnerProfileService(db)
    try:
        return service.get_partner_profile_detail(partner_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du profil partenaire",
        ) from exc


@router.put("/{partner_id}/profile-detail", response_model=PartnerProfileDetailResponse)
def update_partner_profile_detail(
    partner_id: UUID,
    payload: PartnerProfileUpdateRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour les champs canoniques principaux du profil partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce profil partenaire",
        )

    service = PartnerProfileService(db)
    try:
        return service.update_partner_profile_detail(partner_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour du profil partenaire",
        ) from exc


@router.put("/{partner_id}/profile-detail/working-hours", response_model=PartnerProfileDetailResponse)
def update_partner_profile_working_hours(
    partner_id: UUID,
    payload: PartnerProfileWorkingHoursUpdateRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour les horaires canoniques du profil partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce profil partenaire",
        )

    service = PartnerProfileService(db)
    try:
        return service.update_partner_working_hours(partner_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour des horaires partenaire",
        ) from exc


@router.get(
    "/{partner_id}/security/activity-logs",
    response_model=PartnerSecurityActivityLogListResponse,
)
def get_partner_security_activity_logs(
    partner_id: UUID,
    user_id: UUID | None = Query(None, description="Filtre optionnel par utilisateur partenaire"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne les journaux d'activité sécurité/compte des membres d'un partenaire."""
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ces journaux d'activité partenaire",
        )

    def _extract_partner_user_id(row: object) -> UUID | None:
        candidate = row[0] if isinstance(row, tuple) and row else row

        if hasattr(candidate, "user_id"):
            candidate = candidate.user_id
        elif hasattr(candidate, "id") and not isinstance(candidate, (str, bytes)):
            candidate = candidate.id

        return candidate if isinstance(candidate, UUID) else None

    partner_user_ids_query = db.query(PartnerStaff.user_id).filter(PartnerStaff.partner_id == partner_id)
    partner_user_ids = set()
    for row in partner_user_ids_query.all():
        partner_user_id = _extract_partner_user_id(row)
        if partner_user_id:
            partner_user_ids.add(partner_user_id)

    if user_id and user_id not in partner_user_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cet utilisateur partenaire",
        )

    logs_query = (
        db.query(AuditLog, UserModel.name)
        .outerjoin(UserModel, UserModel.id == AuditLog.user_id)
        .filter(AuditLog.user_id.in_(partner_user_ids))
    )

    if user_id:
        logs_query = logs_query.filter(AuditLog.user_id == user_id)

    rows = logs_query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    logs = [
        PartnerSecurityActivityLogResponse(
            id=str(log.id),
            user_id=str(log.user_id) if log.user_id else None,
            user_name=user_name or "Utilisateur inconnu",
            action=log.action,
            resource_type=log.resource_type,
            resource_id=str(log.resource_id) if log.resource_id else None,
            details=log.details,
            created_at=str(log.created_at),
            updated_at=str(log.updated_at),
        )
        for log, user_name in rows
    ]

    return PartnerSecurityActivityLogListResponse(
        logs=logs,
        total=len(logs),
        limit=limit,
    )


@router.post("/orders/{order_id}/proforma", response_model=PartnerGeneratedDocument)
def generate_partner_order_proforma(
    order_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    service = PartnerInvoicingService(db)
    try:
        order = service._get_order_or_raise(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if not user_has_partner_access_sync(db, current_user, order.partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette commande partenaire",
        )

    try:
        return service.generate_document(order_id, "proforma")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération de la proforma",
        ) from exc


@router.post("/orders/{order_id}/invoice", response_model=PartnerGeneratedDocument)
def generate_partner_order_invoice(
    order_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    service = PartnerInvoicingService(db)
    try:
        order = service._get_order_or_raise(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if not user_has_partner_access_sync(db, current_user, order.partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette commande partenaire",
        )

    try:
        return service.generate_document(order_id, "invoice")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération de la facture",
        ) from exc


@router.get("/orders/{order_id}/documents", response_model=PartnerOrderDocumentsResponse)
def get_partner_order_documents(
    order_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    service = PartnerInvoicingService(db)
    try:
        order = service._get_order_or_raise(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if not user_has_partner_access_sync(db, current_user, order.partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ces documents de commande",
        )

    return service.get_order_documents(order_id)
