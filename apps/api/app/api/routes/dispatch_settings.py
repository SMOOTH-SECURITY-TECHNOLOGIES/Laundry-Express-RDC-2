from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, get_current_admin
from app.models.user import User
from app.models.marketplace import DispatchScopeType
from app.schemas.marketplace import (
    DispatchSettingCreate,
    DispatchSettingUpdate,
    DispatchSettingResponse,
    DispatchSettingListResponse
)
from app.services.hybrid_dispatch_service import HybridDispatchService

router = APIRouter(prefix="/dispatch-settings", tags=["dispatch-settings"])


# ===== Dispatch Settings Routes =====

@router.get("", response_model=DispatchSettingListResponse)
def list_dispatch_settings(
    scope_type: Optional[DispatchScopeType] = Query(None, description="Filtrer par type de scope"),
    is_active: Optional[bool] = Query(None, description="Filtrer par actif/inactif"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Lister les paramètres de dispatch (admin uniquement)"""
    skip = (page - 1) * page_size
    service = HybridDispatchService(db)
    
    settings, total = service.marketplace_repo.list_dispatch_settings(
        scope_type=scope_type,
        is_active=is_active,
        skip=skip,
        limit=page_size
    )
    
    return DispatchSettingListResponse(
        settings=settings,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{setting_id}", response_model=DispatchSettingResponse)
def get_dispatch_setting(
    setting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Obtenir un paramètre de dispatch par son ID (admin uniquement)"""
    service = HybridDispatchService(db)
    setting = service.marketplace_repo.get_dispatch_setting(setting_id)
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre de dispatch non trouvé"
        )
    
    return setting


@router.post("", response_model=DispatchSettingResponse, status_code=status.HTTP_201_CREATED)
def create_dispatch_setting(
    setting_data: DispatchSettingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Créer un paramètre de dispatch (admin uniquement)"""
    service = HybridDispatchService(db)
    
    # Vérifier les contraintes d'unicité selon le scope
    if setting_data.scope_type != DispatchScopeType.GLOBAL and setting_data.scope_id:
        # Vérifier s'il existe déjà un setting pour ce scope
        existing_settings = service.marketplace_repo.get_dispatch_settings_by_scope(
            setting_data.scope_type, setting_data.scope_id
        )
        if existing_settings:
            # Pour certains scopes, on pourrait permettre plusieurs settings
            # Mais pour simplifier, on permet un seul setting actif par scope
            active_settings = [s for s in existing_settings if s.is_active]
            if active_settings:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Un paramètre de dispatch actif existe déjà pour ce {setting_data.scope_type.value}"
                )
    
    setting = service.marketplace_repo.create_dispatch_setting(setting_data.dict())
    
    return setting


@router.patch("/{setting_id}", response_model=DispatchSettingResponse)
def update_dispatch_setting(
    setting_id: UUID,
    setting_data: DispatchSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Mettre à jour un paramètre de dispatch (admin uniquement)"""
    service = HybridDispatchService(db)
    
    # Filtrer les champs non nuls
    update_data = {k: v for k, v in setting_data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune donnée à mettre à jour"
        )
    
    setting = service.marketplace_repo.update_dispatch_setting(setting_id, update_data)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre de dispatch non trouvé"
        )
    
    return setting


@router.delete("/{setting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dispatch_setting(
    setting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Supprimer un paramètre de dispatch (admin uniquement)"""
    service = HybridDispatchService(db)
    
    setting = service.marketplace_repo.get_dispatch_setting(setting_id)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre de dispatch non trouvé"
        )
    
    # Au lieu de supprimer, on désactive
    setting.is_active = False
    db.commit()
    
    return None


# ===== Utility Routes =====

@router.get("/resolve-strategy", response_model=DispatchSettingResponse)
def resolve_dispatch_strategy(
    scope_type: DispatchScopeType,
    scope_id: Optional[UUID] = Query(None, description="ID du scope (partenaire, ville, etc.)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Résoudre la stratégie de dispatch pour un scope donné (admin uniquement)"""
    service = HybridDispatchService(db)
    
    settings = service.marketplace_repo.get_dispatch_settings_by_scope(scope_type, scope_id)
    if not settings:
        # Retourner le setting global par défaut
        global_settings = service.marketplace_repo.get_dispatch_settings_by_scope(DispatchScopeType.GLOBAL)
        if not global_settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucun paramètre de dispatch trouvé"
            )
        return global_settings[0]
    
    # Retourner le setting le plus récent
    return settings[0]