from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.subscription import SubscriptionPlanConfig
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionPlanCreate,
    SubscriptionPlanListResponse,
    SubscriptionPlanResponse,
    SubscriptionPlanUpdate,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

DEFAULT_PLANS = [
    {
        "slug": "basic",
        "name": "Essentiel",
        "description": "Parfait pour les petits pressings de quartier.",
        "price_monthly": Decimal("29.00"),
        "price_yearly": Decimal("290.00"),
        "is_most_popular": False,
        "features": {
            "analytics": True,
            "promotions": True,
        },
    },
    {
        "slug": "pro",
        "name": "Professionnel",
        "description": "Pour les entreprises en pleine croissance.",
        "price_monthly": Decimal("79.00"),
        "price_yearly": Decimal("790.00"),
        "is_most_popular": True,
        "features": {
            "analytics": True,
            "promotions": True,
            "customSubdomain": True,
            "teamManagement": True,
            "advancedAutomation": True,
        },
    },
    {
        "slug": "enterprise",
        "name": "Entreprise",
        "description": "Solutions sur mesure pour grands groupes.",
        "price_monthly": Decimal("199.00"),
        "price_yearly": Decimal("1990.00"),
        "is_most_popular": False,
        "features": {
            "analytics": True,
            "promotions": True,
            "customSubdomain": True,
            "customDomain": True,
            "teamManagement": True,
            "advancedAutomation": True,
            "apiAccess": True,
            "aiReviewAssistant": True,
            "invoiceGenerator": True,
        },
    },
]


def _ensure_default_plans(db: Session) -> None:
    existing = db.query(SubscriptionPlanConfig).count()
    if existing:
        return

    for plan in DEFAULT_PLANS:
        db.add(SubscriptionPlanConfig(**plan))
    db.commit()


def _to_response(plan: SubscriptionPlanConfig) -> SubscriptionPlanResponse:
    return SubscriptionPlanResponse(
        id=plan.id,
        slug=plan.slug,
        name=plan.name,
        description=plan.description,
        price_monthly=float(plan.price_monthly),
        price_yearly=float(plan.price_yearly),
        is_most_popular=plan.is_most_popular,
        features=plan.features or {},
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


@router.get("/plans", response_model=SubscriptionPlanListResponse)
def list_subscription_plans(db: Session = Depends(get_sync_db)):
    _ensure_default_plans(db)
    plans = db.query(SubscriptionPlanConfig).order_by(SubscriptionPlanConfig.price_monthly.asc()).all()
    return SubscriptionPlanListResponse(plans=[_to_response(plan) for plan in plans], total=len(plans))


@router.post("/plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_subscription_plan(
    data: SubscriptionPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    existing = db.query(SubscriptionPlanConfig).filter(SubscriptionPlanConfig.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Un plan avec ce slug existe déjà")

    plan = SubscriptionPlanConfig(
        slug=data.slug,
        name=data.name,
        description=data.description,
        price_monthly=Decimal(str(data.price_monthly)),
        price_yearly=Decimal(str(data.price_yearly)),
        is_most_popular=data.is_most_popular,
        features=data.features.model_dump(),
    )
    db.add(plan)
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="create",
        resource_type="subscription_plan",
        resource_id=plan.id,
        details={"slug": plan.slug},
    )
    db.commit()
    db.refresh(plan)
    return _to_response(plan)


@router.patch("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
def update_subscription_plan(
    plan_id: str,
    data: SubscriptionPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    plan = db.query(SubscriptionPlanConfig).filter(SubscriptionPlanConfig.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan non trouvé")

    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        if field in {"price_monthly", "price_yearly"} and value is not None:
            setattr(plan, field, Decimal(str(value)))
        elif field == "features" and value is not None:
            plan.features = value
        else:
            setattr(plan, field, value)

    db.add(plan)
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="subscription_plan",
        resource_id=plan.id,
        details={"slug": plan.slug},
    )
    db.commit()
    db.refresh(plan)
    return _to_response(plan)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    plan = db.query(SubscriptionPlanConfig).filter(SubscriptionPlanConfig.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan non trouvé")

    AuditService(db).log_event(
        user_id=current_user.id,
        action="delete",
        resource_type="subscription_plan",
        resource_id=plan.id,
        details={"slug": plan.slug},
    )
    db.delete(plan)
    db.commit()
    return None
