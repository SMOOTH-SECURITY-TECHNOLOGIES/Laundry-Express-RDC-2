# PROMPT D'EXÉCUTION COMPLET - Laundry Express SRC 2
## Phase Intégration Opérationnelle - Transformation Engineering MVP → Operational MVP STAGING READY

---

## 🎯 CONTEXTE ET MISSION

**Tu es le Lead Full-Stack Engineer / CTO Execution Assistant** pour le projet **Laundry Express SRC 2**.

**Mission** : Transformer l'état actuel du projet (Engineering MVP) en **Operational MVP STAGING READY**.

**État actuel** :
- Backend : Architecture solide, tests d'intégration passés, mais routes API partiellement fonctionnelles
- Frontend : Structure complète, composants prêts, mais connecté à des mocks
- Infrastructure : Docker fonctionnel, DB stable, Redis opérationnel
- Problème principal : Chaîne frontend/backend non connectée, workflows E2E non validés

**Objectif final** :
- Backend stable avec routes MVP fonctionnelles
- Frontend connecté au backend réel (0 appel mock dans workflows critiques)
- Workflows critiques validés end-to-end
- Tests E2E fonctionnels
- Environnement staging prêt

---

## 🏗️ ARCHITECTURE EXISTANTE

### Backend Stack
- FastAPI + SQLAlchemy 2.x + PostgreSQL + Redis + Celery
- Alembic migrations + JWT authentication + Docker Compose
- Modules : Auth, Users, Orders, Pricing, Hybrid Dispatch, Payments, Refunds, Disputes, Commissions
- API versionnée `/api/v1`, Swagger disponible `/docs`
- Tests backend : 9/9 tests d'intégration passés

### Frontend Stack
- React + TypeScript + Vite + Tailwind + Context API
- Services API existants (`services/api.ts`, `services/real-api.ts`)
- Mocks encore présents dans les workflows critiques

### Infrastructure
- Docker Compose : API (port 18000), DB (port 5433), Redis (port 6379), Worker
- Services stables et healthy

---

## 🚨 RÈGLES D'EXÉCUTION STRICTES

1. **Ne pas sur-ingénieriser** - Corriger, ne pas réinventer
2. **Ne pas recréer l'architecture** - Utiliser l'existant
3. **Ne pas ajouter de nouvelles fonctionnalités hors MVP** - Focus intégration
4. **Corriger les flows existants** - Priorité aux workflows critiques
5. **Toujours produire du code réel** - Pas de pseudo-code
6. **Toujours fournir commandes exécutées** - Avec sorties réelles
7. **Prioriser stabilité et intégration** - Stabilité > Features
8. **Signaler clairement les routes backend manquantes** - Diagnostic précis
9. **Ne jamais conclure "production ready" sans validation E2E** - Objectif : staging ready

---

## 📋 PRIORITÉS D'EXÉCUTION (ORDRE STRICT)

### 1️⃣ STABILISER ROUTES API MVP
- Identifier et corriger routes 404/500
- Figer contrat API MVP
- Valider schémas Pydantic
- Documenter Swagger

### 2️⃣ CORRIGER TESTS D'INTÉGRATION BACKEND
- Utiliser `pytest_asyncio` + `httpx.AsyncClient`
- Corriger fixtures async
- Valider workflows backend complets

### 3️⃣ CONNECTER FRONTEND AU BACKEND RÉEL
- Configurer `VITE_API_BASE_URL=http://localhost:18000/api/v1`
- Activer `real-api.ts` dans `services/api.ts`
- Créer client API central avec gestion token JWT

### 4️⃣ REMPLACER MOCKS CRITIQUES
- Auth (login/register/current user)
- Orders (création/liste/détail)
- Pricing (estimation)
- Payments (intent/confirmation/summary)
- Refunds (demandes)
- Disputes (création)

### 5️⃣ VALIDER WORKFLOWS E2E
- Flow 1 : Login → Pricing → Create Order → View Order
- Flow 2 : Create Payment Intent → Confirm Cash → Payment Summary
- Flow 3 : Refund Request → Refund Visible
- Flow 4 : Create Dispute → Dispute Status Visible

### 6️⃣ AJOUTER LOGS MINIMUM
- `order_created`, `order_paid`, `payment_intent_created`
- `refund_requested`, `dispute_created`, `task_assigned`

### 7️⃣ PRÉPARER STAGING
- Variables d'environnement staging
- Données de test réalistes
- Monitoring de base

---

## 🎯 CONTRAT API MVP À FIGER ET CORRIGER

### Auth (Priorité 1)
```
POST   /api/v1/auth/login          [500 → 200]
POST   /api/v1/auth/register       [500 → 201]
GET    /api/v1/auth/me             [403 → 200]
```

### Orders (Priorité 2)
```
POST   /api/v1/orders              [404 → 201]
GET    /api/v1/orders              [404 → 200]
GET    /api/v1/orders/{id}         [404 → 200]
```

### Pricing (Priorité 2)
```
POST   /api/v1/orders/estimate     [404 → 200]
```

### Payments (Priorité 3)
```
POST   /api/v1/payments/intents                     [404 → 201]
POST   /api/v1/payments/intents/{id}/confirm-cash   [404 → 200]
GET    /api/v1/payments/orders/{id}/summary         [404 → 200]
```

### Refunds (Priorité 4)
```
POST   /api/v1/refunds/requests    [404 → 201]
```

### Disputes (Priorité 4)
```
POST   /api/v1/disputes            [404 → 201]
```

**Chaque route doit** :
- Retourner réponse valide avec schéma Pydantic correct
- Être documentée dans Swagger
- Avoir tests d'intégration correspondants
- Gérer erreurs proprement

---

## 🔧 BACKEND - ACTIONS CONCRÈTES

### 1. Diagnostiquer routes cassées
```bash
# Vérifier logs erreurs
docker compose logs api --tail=100 | grep -E "(404|500|Exception|Error)"

# Tester routes manuelles
curl -X POST http://localhost:18000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"+243810000000","name":"Test User","password":"TEST_SECRET_FROM_ENV"}'
```

### 2. Corriger routes dans `app/main.py`
- Vérifier imports des routers
- Corriger préfixes de routes
- Ajouter routers manquants

### 3. Corriger services et repositories
- Vérifier méthodes `create`, `get`, `list`
- Corriger validations Pydantic V2
- Gérer exceptions proprement

### 4. Corriger tests d'intégration
```python
# Fixture correcte
@pytest_asyncio.fixture
async def client(app):
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# Test auth corrigé
async def test_register_user(client):
    user_data = {
        "email": "test@example.com",
        "phone": "+243810000000",
        "name": "Test User",
        "password": "TEST_SECRET_FROM_ENV"
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["email"] == user_data["email"]
```

### 5. Ajouter logs structurés
```python
# Dans les services
logger.info("order_created", extra={
    "order_id": order.id,
    "customer_id": order.customer_id,
    "total_amount": order.total_amount
})
```

---

## 🎨 FRONTEND - ACTIONS CONCRÈTES

### 1. Configurer connexion API
```typescript
// .env.local
VITE_API_BASE_URL=http://localhost:18000/api/v1

// services/api.ts
import { realApi } from './real-api';

// Remplacer les mocks par realApi
export const api = process.env.NODE_ENV === 'development' ? realApi : realApi;
```

### 2. Créer client API central
```typescript
// services/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Interceptor pour token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor pour gestion erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. Brancher AuthContext
```typescript
// context/AuthContext.tsx
const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('auth_token', access_token);
    setUser(user);
    return user;
  } catch (error) {
    throw new Error('Login failed');
  }
};
```

### 4. Brancher composants critiques
- `AuthContext.tsx` → API réelle
- `ServiceSelector.tsx` → `realApi.estimateOrderPrice()`
- `CreateTicketModal.tsx` → `realApi.createOrder()`
- `PaymentModal.tsx` → `realApi.createPaymentIntent()`
- `OrderPage.tsx` → `realApi.getOrders()`
- `OrderSummary.tsx` → `realApi.getOrder()`

### 5. Implémenter loading states
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleCreateOrder = async () => {
  setLoading(true);
  setError(null);
  try {
    const order = await realApi.createOrder(orderData);
    // Succès
  } catch (err) {
    setError('Failed to create order');
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 TESTS E2E - VALIDATION WORKFLOWS

### Script E2E critiques
```javascript
// scripts/e2e-critical-flows.js
const workflows = [
  {
    name: 'Auth + Order Flow',
    steps: [
      'POST /auth/register → 201',
      'POST /auth/login → 200',
      'GET /auth/me → 200',
      'POST /orders/estimate → 200',
      'POST /orders → 201',
      'GET /orders/{id} → 200'
    ]
  },
  {
    name: 'Payment Flow',
    steps: [
      'POST /payments/intents → 201',
      'POST /payments/intents/{id}/confirm-cash → 200',
      'GET /payments/orders/{id}/summary → 200'
    ]
  }
];
```

### Exécution validation
```bash
# Backend tests
cd apps/api && python -m pytest tests/integration/ -v

# E2E tests
node scripts/e2e-critical-flows.js

# Health check
curl http://localhost:18000/health
```

---

## 📊 COMMANDES DE SURVEILLANCE

### Backend
```bash
# Services status
docker compose ps

# Logs en temps réel
docker compose logs api --tail=100 -f

# Tests
docker compose exec api pytest tests/ -v

# Migrations
docker compose exec api alembic current
docker compose exec api alembic upgrade head

# DB check
docker compose exec db psql -U laundry_user -d laundry_express -c "SELECT COUNT(*) FROM users;"
```

### Frontend
```bash
# Développement
npm run dev

# Build
npm run build

# Tests
npm test

# E2E validation
node scripts/validate-e2e.js
```

---

## 📝 STRUCTURE DE RÉPONSE ATTENDUE

Pour chaque phase, fournir :

### 1. Objectif de la phase
### 2. Diagnostic initial (ce qui ne marche pas)
### 3. Routes corrigées (avant/après)
### 4. Fichiers modifiés (avec diff si pertinent)
### 5. Code complet des corrections
### 6. Connexion frontend/backend établie
### 7. Mocks supprimés (liste)
### 8. Commandes exécutées (avec sorties)
### 9. Sorties réelles (logs, tests)
### 10. Workflows E2E validés (résultats)
### 11. Logs ajoutés (exemples)
### 12. Statut final de la phase

---

## 🎖️ CRITÈRES DE SUCCÈS FINAL

Le projet atteint **STAGING READY** quand :

### Backend
- [ ] Routes MVP 100% fonctionnelles (0 erreur 404/500)
- [ ] Tests d'intégration 100% passants
- [ ] Documentation Swagger à jour
- [ ] Logs structurés opérationnels

### Frontend
- [ ] 0 appel mock dans les workflows critiques
- [ ] 100% des composants connectés à l'API réelle
- [ ] Gestion d'erreur utilisateur friendly
- [ ] Loading states appropriés

### Tests
- [ ] 4 workflows E2E critiques 100% passants
- [ ] Temps d'exécution E2E < 2 minutes
- [ ] Automatisation CI/CD prête

### Staging
- [ ] Environnement accessible et stable
- [ ] Données de test réalistes
- [ ] Monitoring de base configuré
- [ ] Backup/restore testé

---

## 🚨 ESCALATION ET BLOCAGES

### Niveau 1 : Problèmes techniques mineurs
- Corrections de bugs, questions d'implémentation
- **Action** : Documenter et corriger

### Niveau 2 : Blocages techniques majeurs
- Routes impossibles à corriger, architecture problématique
- **Action** : Documenter précisément + proposer solution alternative

### Niveau 3 : Problèmes business critiques
- MVP non réalisable, changements de scope nécessaires
- **Action** : Escalation immédiate avec analyse impact

---

## 📅 PLAN TEMPOREL INDICATIF

### Jour 1-2 : Fondations
- Routes auth fonctionnelles
- Frontend auth connecté
- Token JWT opérationnel

### Jour 3-4 : Cœur métier
- Estimation prix fonctionnelle
- Création commande fonctionnelle
- Paiements fonctionnels

### Jour 5-6 : Validation
- Tests E2E 100% passants
- Workflows critiques validés
- Automatisation CI/CD

### Jour 7 : Staging
- Environnement staging opérationnel
- Tests manuels validés
- Documentation complète

---

## 💡 PHILOSOPHIE D'EXÉCUTION

**"Nous avons construit une excellente fondation. Maintenant, concentrons-nous sur la connexion des pièces pour délivrer un produit démontrable. Le plan est clair, les étapes sont concrètes, le succès est à portée."**

**Priorité absolue** : Avoir un produit staging-ready qui démontre la valeur business et permet de collecter des feedbacks utilisateurs réels.

---

*Prompt préparé pour exécution immédiate - Version 1.0 - 16/03/2026*

**Prochaine étape logique** : Une fois le staging validé, construire les dashboards complets (Admin / Partner / Client) pour la phase production-ready.
