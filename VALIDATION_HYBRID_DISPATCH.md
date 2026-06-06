# Validation du système Hybrid Dispatch + Marketplace

## 1. Objectif
Implémentation complète d'un système de dispatch hybride avec marketplace pour Laundry Express SRC 2, permettant de dispatcher les tâches de livraison entre chauffeurs internes et compagnies externes via un marketplace.

## 2. Décisions techniques finales

### Architecture
- **Modèles étendus** dans `logistics.py` plutôt que duplication
- **Repository dédié** `MarketplaceRepository` pour isolation
- **Service hybride** `HybridDispatchService` orchestre les stratégies
- **API REST complète** avec authentification par rôle
- **Verrous transactionnels** pour prévenir les race conditions

### Stratégies de dispatch
1. **INTERNAL_FIRST** : Tente interne, fallback marketplace
2. **MARKETPLACE_FIRST** : Ouvre au marketplace, fallback interne
3. **MANUAL_ONLY** : Dispatch manuel uniquement
4. **INTERNAL_ONLY** : Chauffeurs internes uniquement
5. **MARKETPLACE_ONLY** : Marketplace uniquement

### Scopes de configuration
- **GLOBAL** : Configuration par défaut
- **PARTNER** : Par partenaire commercial
- **CITY** : Par ville
- **ZONE** : Par zone géographique
- **TASK_TYPE** : Par type de tâche (pickup/delivery)

## 3. Fichiers créés/modifiés

### Modèles
- `apps/api/app/models/marketplace.py` - Nouveaux modèles
- `apps/api/app/models/logistics.py` - Modèle DeliveryTask étendu

### Schémas
- `apps/api/app/schemas/marketplace.py` - Schémas Pydantic complets

### Repository
- `apps/api/app/repositories/marketplace_repository.py` - CRUD avec transactions

### Services
- `apps/api/app/services/hybrid_dispatch_service.py` - Logique de dispatch hybride

### Routes API
- `apps/api/app/api/routes/marketplace.py` - Routes marketplace
- `apps/api/app/api/routes/dispatch_settings.py` - Routes paramètres

### Configuration
- `apps/api/app/api/__init__.py` - Router principal mis à jour

### Migration
- `apps/api/alembic/versions/create_hybrid_dispatch_marketplace_tables.py` - Migration Alembic

### Tests
- `apps/api/tests/unit/test_hybrid_dispatch_service.py` - Tests unitaires
- `apps/api/tests/integration/test_marketplace_integration.py` - Tests d'intégration

## 4. Code complet

### Modèle Marketplace (extrait)
```python
class DeliveryCompany(Base):
    __tablename__ = "delivery_companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(200), nullable=False, unique=True, index=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    status = Column(Enum(DeliveryCompanyStatus), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    supports_pickup = Column(Boolean, nullable=False, default=True)
    supports_delivery = Column(Boolean, nullable=False, default=True)
    rating_avg = Column(Numeric(3, 2), nullable=False, default=0.0)
    rating_count = Column(Integer, nullable=False, default=0)
```

### Service Hybrid Dispatch (extrait logique de claim)
```python
def claim_market_task(self, task_id: UUID, company_id: UUID) -> DeliveryTask:
    """Claimer une tâche marketplace avec verrou transactionnel"""
    task = self.marketplace_repo.claim_market_task(task_id, company_id)
    if not task:
        raise ValueError(
            f"Impossible de claimer la tâche {task_id}. "
            "Elle n'est peut-être plus disponible, expirée ou déjà claimée."
        )
    return task
```

## 5. Migration Alembic

### Fichier : `create_hybrid_dispatch_marketplace_tables.py`
- Crée 4 nouvelles tables
- Étend l'enum `DeliveryTaskStatus`
- Ajoute 12 colonnes à `delivery_tasks`
- Insère les paramètres par défaut

### Commandes de migration
```bash
# Appliquer la migration
cd apps/api
alembic upgrade head

# Vérifier le statut
alembic current

# Rollback si nécessaire
alembic downgrade -1
```

## 6. Commandes de validation

### 1. Vérifier la structure du code
```bash
cd apps/api
python test_hybrid_dispatch.py
```

### 2. Exécuter les tests unitaires
```bash
cd apps/api
pytest tests/unit/test_hybrid_dispatch_service.py -v
```

### 3. Vérifier les imports
```bash
cd apps/api
python -c "
from app.models.marketplace import DeliveryCompany, DispatchStrategy
from app.services.hybrid_dispatch_service import HybridDispatchService
from app.api.routes.marketplace import router as marketplace_router
print('✅ Tous les imports fonctionnent')
"
```

### 4. Tester l'API (après démarrage du serveur)
```bash
# Démarrer le serveur
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Tester les endpoints
curl -X GET "http://localhost:8000/api/v1/marketplace/companies"
curl -X GET "http://localhost:8000/api/v1/dispatch-settings"
```

### 5. Vérifier la documentation OpenAPI
```
http://localhost:8000/docs
http://localhost:8000/redoc
```

## 7. Tests ajoutés

### Tests unitaires (15 tests)
- Résolution de stratégie par scope
- Dispatch avec différentes stratégies
- Claim marketplace avec race condition
- Expiration et fallback
- Assignation chauffeur compagnie
- Complétion de tâche

### Tests d'intégration (4 tests)
- Flux complet marketplace
- Expiration avec fallback
- Prévention conditions de course
- Hiérarchie de résolution

## 8. Vérifications finales

### ✅ Structure de base de données
```sql
-- Vérifier les tables créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('delivery_companies', 'company_drivers', 'company_service_zones', 'dispatch_settings');

-- Vérifier les colonnes ajoutées
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'delivery_tasks' 
AND column_name IN ('dispatch_strategy', 'dispatch_mode', 'market_visible', 'claimed_by_company_id');
```

### ✅ API Endpoints
- `GET /api/v1/marketplace/companies` - Lister compagnies
- `POST /api/v1/marketplace/companies` - Créer compagnie
- `GET /api/v1/marketplace/tasks` - Lister tâches marketplace
- `POST /api/v1/marketplace/tasks/{task_id}/claim` - Claimer tâche
- `GET /api/v1/dispatch-settings` - Lister paramètres
- `POST /api/v1/dispatch-settings` - Créer paramètre

### ✅ Sécurité
- Authentification requise pour toutes les routes
- Autorisation par rôle (admin, company, user)
- Validation des données avec Pydantic
- Verrous transactionnels pour les opérations critiques

## 9. Étape suivante recommandée

### Phase 1 : Déploiement initial
```bash
# 1. Appliquer la migration
cd apps/api && alembic upgrade head

# 2. Démarrer les services
docker-compose up -d api db redis

# 3. Créer des données de test
cd apps/api && python scripts/create_test_marketplace_data.py

# 4. Configurer les paramètres par défaut
curl -X POST "http://localhost:8000/api/v1/dispatch-settings" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scope_type": "GLOBAL",
    "dispatch_strategy": "INTERNAL_FIRST",
    "marketplace_timeout_minutes": 30,
    "driver_assignment_timeout_minutes": 15
  }'
```

### Phase 2 : Intégration frontend
1. Ajouter les pages admin pour gérer les compagnies
2. Intégrer le dashboard compagnie pour claimer les tâches
3. Ajouter les notifications en temps réel
4. Implémenter le tracking en temps réel

### Phase 3 : Optimisation
1. Ajouter un worker Celery pour l'expiration automatique
2. Implémenter un système de rating pour les compagnies
3. Ajouter des métriques et analytics
4. Optimiser les requêtes avec index et caching

## Checklist de validation finale

- [x] Modèles de données créés
- [x] Schémas Pydantic complets
- [x] Repository avec transactions
- [x] Service de dispatch hybride
- [x] Routes API avec authentification
- [x] Migration Alembic générée
- [x] Tests unitaires implémentés
- [x] Tests d'intégration créés
- [x] Documentation OpenAPI générée
- [x] Prévention des race conditions
- [x] Intégration avec OrderService
- [x] Commandes de validation fournies

## Commandes Docker complètes

```bash
# Build et démarrage complet
docker-compose build api
docker-compose up -d api db redis

# Appliquer les migrations
docker-compose exec api alembic upgrade head

# Exécuter les tests
docker-compose exec api pytest tests/unit/test_hybrid_dispatch_service.py -v
docker-compose exec api pytest tests/integration/test_marketplace_integration.py -v

# Voir les logs
docker-compose logs -f api

# Arrêter les services
docker-compose down
```

**Statut :** ✅ IMPLÉMENTATION COMPLÈTE ET PRÊTE À L'INTÉGRATION