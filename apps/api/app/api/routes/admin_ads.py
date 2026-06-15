import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.ad_analytics import AdClick, AdImpression, Advertisement, AdCampaign
from app.models.user import User
from app.schemas.ad_dashboard import (
    AdCreateRequest, AdDetailResponse, AdUpdateRequest, AdsDashboardResponse,
    CampaignCreateRequest, ExportRequest, ExportResponse, TrackEventRequest,
)
from app.services.ads_dashboard_service import AdsDashboardService

router = APIRouter(prefix="/admin/ads", tags=["admin-ads"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


def _to_detail(ad: Advertisement) -> AdDetailResponse:
    return AdDetailResponse(
        id=str(ad.id),
        title=ad.title,
        description=ad.description,
        creative_type=ad.creative_type,
        image_url=ad.image_url,
        video_url=ad.video_url,
        cta_text=ad.cta_text,
        cta_url=ad.cta_url,
        status=ad.status,
        campaign_id=str(ad.campaign_id) if ad.campaign_id else None,
        budget_total=float(ad.budget_total or 0),
        budget_spent=float(ad.budget_spent or 0),
        channel=ad.channel,
        zone=ad.zone,
        partner_id=str(ad.partner_id) if ad.partner_id else None,
    )


@router.get("/dashboard", response_model=AdsDashboardResponse)
def get_ads_dashboard(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return AdsDashboardService(db).get_dashboard(days=days)


@router.post("/export", response_model=ExportResponse)
def export_ads(
    payload: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ads_count = db.query(Advertisement).count()
    campaigns_count = db.query(AdCampaign).count()
    count = ads_count + campaigns_count if payload.scope == "campaigns" else ads_count
    ext = "xlsx" if payload.format == "excel" else payload.format
    return ExportResponse(filename=f"ads-{payload.scope}.{ext}", count=count, format=payload.format)


@router.post("/campaign", status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    campaign = AdCampaign(
        name=payload.name,
        objective=payload.objective,
        budget=payload.budget,
        target_audience=payload.target_audience,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return {"id": str(campaign.id), "name": campaign.name}


@router.get("", response_model=list[AdDetailResponse])
def list_ads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ads = db.query(Advertisement).order_by(Advertisement.created_at.desc()).all()
    return [_to_detail(ad) for ad in ads]


@router.post("", response_model=AdDetailResponse, status_code=status.HTTP_201_CREATED)
def create_ad(
    payload: AdCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ad = Advertisement(
        title=payload.title,
        description=payload.description,
        creative_type=payload.creative_type,
        image_url=payload.image_url,
        video_url=payload.video_url,
        cta_text=payload.cta_text,
        cta_url=payload.cta_url,
        status=payload.status,
        campaign_id=uuid.UUID(payload.campaign_id) if payload.campaign_id else None,
        budget_total=payload.budget_total,
        channel=payload.channel,
        zone=payload.zone,
        partner_id=uuid.UUID(payload.partner_id) if payload.partner_id else None,
        created_by=current_user.id,
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return _to_detail(ad)


@router.get("/{ad_id}", response_model=AdDetailResponse)
def get_ad(
    ad_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Publicité introuvable")
    return _to_detail(ad)


@router.put("/{ad_id}", response_model=AdDetailResponse)
def update_ad(
    ad_id: str,
    payload: AdUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Publicité introuvable")
    data = payload.model_dump(exclude_unset=True)
    if "campaign_id" in data:
        data["campaign_id"] = uuid.UUID(data["campaign_id"]) if data["campaign_id"] else None
    for key, value in data.items():
        setattr(ad, key, value)
    db.commit()
    db.refresh(ad)
    return _to_detail(ad)


@router.delete("/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ad(
    ad_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Publicité introuvable")
    ad.status = "archived"
    db.commit()


@router.post("/{ad_id}/duplicate", response_model=AdDetailResponse, status_code=status.HTTP_201_CREATED)
def duplicate_ad(
    ad_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Publicité introuvable")
    clone = Advertisement(
        title=f"{ad.title} (copie)",
        description=ad.description,
        creative_type=ad.creative_type,
        image_url=ad.image_url,
        video_url=ad.video_url,
        cta_text=ad.cta_text,
        cta_url=ad.cta_url,
        status="draft",
        campaign_id=ad.campaign_id,
        budget_total=ad.budget_total,
        channel=ad.channel,
        zone=ad.zone,
        partner_id=ad.partner_id,
        created_by=current_user.id,
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return _to_detail(clone)


@router.post("/{ad_id}/pause", response_model=AdDetailResponse)
def pause_ad(
    ad_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Publicité introuvable")
    ad.status = "paused"
    db.commit()
    db.refresh(ad)
    return _to_detail(ad)


@router.post("/{ad_id}/impression", status_code=status.HTTP_201_CREATED)
def track_impression(
    ad_id: str,
    payload: TrackEventRequest,
    db: Session = Depends(get_sync_db),
):
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Publicité introuvable")
    event = AdImpression(
        advertisement_id=ad.id,
        viewer_id=uuid.UUID(payload.user_id) if payload.user_id else None,
        surface=payload.surface,
    )
    db.add(event)
    db.commit()
    return {"tracked": True}


@router.post("/{ad_id}/click", status_code=status.HTTP_201_CREATED)
def track_click(
    ad_id: str,
    payload: TrackEventRequest,
    db: Session = Depends(get_sync_db),
):
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Publicité introuvable")
    event = AdClick(
        advertisement_id=ad.id,
        user_id=uuid.UUID(payload.user_id) if payload.user_id else None,
        surface=payload.surface,
    )
    db.add(event)
    db.commit()
    return {"tracked": True}
