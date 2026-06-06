from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.content import SiteContentConfig
from app.models.user import User
from app.schemas.content import SiteContentPayload, SiteContentResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/content", tags=["content"])

SITE_CONTENT_KEY = "site"
DEFAULT_SITE_CONTENT = {
    "hero": {
        "title": "homePage.hero.title",
        "subtitle": "homePage.hero.subtitle",
    },
    "howItWorksSteps": [
        {
            "id": "step-1",
            "title": "homePage.howItWorks.step1.title",
            "description": "homePage.howItWorks.step1.description",
            "icon": "shoppingBag",
        },
        {
            "id": "step-2",
            "title": "homePage.howItWorks.step2.title",
            "description": "homePage.howItWorks.step2.description",
            "icon": "truck",
        },
        {
            "id": "step-3",
            "title": "homePage.howItWorks.step3.title",
            "description": "homePage.howItWorks.step3.description",
            "icon": "sparkles",
        },
        {
            "id": "step-4",
            "title": "homePage.howItWorks.step4.title",
            "description": "homePage.howItWorks.step4.description",
            "icon": "home",
        },
    ],
    "faq": [
        {
            "id": "q1",
            "question": "homePage.faq.q1.question",
            "answer": "homePage.faq.q1.answer",
        },
        {
            "id": "q2",
            "question": "homePage.faq.q2.question",
            "answer": "homePage.faq.q2.answer",
        },
        {
            "id": "q3",
            "question": "homePage.faq.q3.question",
            "answer": "homePage.faq.q3.answer",
        },
    ],
}


def _get_config(db: Session) -> SiteContentConfig | None:
    return db.query(SiteContentConfig).filter(SiteContentConfig.key == SITE_CONTENT_KEY).first()


def _to_response(config: SiteContentConfig | None) -> SiteContentResponse:
    if config is None:
        return SiteContentResponse(
            id=None,
            key=SITE_CONTENT_KEY,
            content_data=SiteContentPayload.model_validate(DEFAULT_SITE_CONTENT),
            created_at=None,
            updated_at=None,
        )

    return SiteContentResponse(
        id=config.id,
        key=config.key,
        content_data=SiteContentPayload.model_validate(config.content_data),
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.get("/site", response_model=SiteContentResponse)
def get_site_content(db: Session = Depends(get_sync_db)):
    return _to_response(_get_config(db))


@router.put("/site", response_model=SiteContentResponse)
def update_site_content(
    data: SiteContentPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    config = _get_config(db)
    if config is None:
        config = SiteContentConfig(key=SITE_CONTENT_KEY, content_data=data.model_dump())
        db.add(config)
    else:
        config.content_data = data.model_dump()
        db.add(config)

    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="site_content",
        resource_id=config.id,
        details={"key": SITE_CONTENT_KEY},
    )
    db.commit()
    db.refresh(config)
    return _to_response(config)
