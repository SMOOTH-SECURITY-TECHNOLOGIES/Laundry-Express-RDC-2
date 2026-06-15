from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.marketing_campaign import MarketingAutomation, MarketingCampaign
from app.models.user import User
from app.schemas.campaign_dashboard import (
    CampaignAnalyticsResponse, CampaignCreateRequest, CampaignDashboardResponse,
    CampaignExportRequest, CampaignUpdateRequest,
)
from app.services.audit_service import AuditService
from app.services.campaigns_dashboard_service import CampaignsDashboardService

router = APIRouter(prefix="/admin/campaigns", tags=["admin-campaigns"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=CampaignDashboardResponse)
def get_dashboard(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard(days=days)


@router.get("")
def list_campaigns(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard().campaigns


@router.get("/channels")
def channels(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard().channels


@router.get("/segments")
def segments(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard().segments


@router.get("/roi")
def roi(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard().roi


@router.get("/watchlist")
def watchlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard().watchlist


@router.get("/calendar")
def calendar(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard().calendar


@router.get("/automations")
def automations(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CampaignsDashboardService(db).get_dashboard().automations


@router.post("/export")
def export_campaigns(
    payload: CampaignExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    bundle = CampaignsDashboardService(db).get_dashboard()
    ext = "xlsx" if payload.format == "excel" else payload.format
    return {"filename": f"campaigns-{payload.scope}.{ext}", "count": len(bundle.campaigns), "format": payload.format}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    status_val = "scheduled" if payload.scheduled_at else "active"
    campaign = MarketingCampaign(
        name=payload.name, channel=payload.channel, audience=payload.audience,
        segment=payload.segment, content=payload.content, budget=Decimal(str(payload.budget)),
        status=status_val, scheduled_at=payload.scheduled_at,
        start_date=payload.start_date, end_date=payload.end_date,
        zone=payload.zone, partner=payload.partner,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    AuditService(db).log_event(
        user_id=current_user.id, action="create",
        resource_type="marketing_campaign", resource_id=campaign.id,
        details={"name": payload.name, "channel": payload.channel},
    )
    db.commit()
    return {"id": str(campaign.id), "name": campaign.name}


@router.put("/{campaign_id}")
def update_campaign(
    campaign_id: str,
    payload: CampaignUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    campaign = db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    for field, col in [
        ("name", "name"), ("channel", "channel"), ("audience", "audience"),
        ("segment", "segment"), ("content", "content"), ("status", "status"),
        ("scheduled_at", "scheduled_at"), ("start_date", "start_date"), ("end_date", "end_date"),
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(campaign, col, val)
    if payload.budget is not None:
        campaign.budget = Decimal(str(payload.budget))
    db.commit()
    return {"id": str(campaign.id), "name": campaign.name}


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    campaign = db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    db.delete(campaign)
    db.commit()


@router.post("/{campaign_id}/pause")
def pause_campaign(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    campaign = db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    campaign.status = "paused"
    db.commit()
    return {"id": str(campaign.id), "status": campaign.status}


@router.post("/{campaign_id}/resume")
def resume_campaign(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    campaign = db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    campaign.status = "active"
    db.commit()
    return {"id": str(campaign.id), "status": campaign.status}


@router.post("/{campaign_id}/duplicate", status_code=status.HTTP_201_CREATED)
def duplicate_campaign(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    src = db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    dup = MarketingCampaign(
        name=f"{src.name} (copie)", channel=src.channel, audience=src.audience,
        segment=src.segment, status="draft", content=src.content, budget=src.budget,
        zone=src.zone, partner=src.partner,
    )
    db.add(dup)
    db.commit()
    db.refresh(dup)
    return {"id": str(dup.id), "name": dup.name}


@router.get("/{campaign_id}/analytics", response_model=CampaignAnalyticsResponse)
def campaign_analytics(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    result = CampaignsDashboardService(db).get_analytics(campaign_id)
    if not result:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    return result
