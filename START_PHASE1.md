# Phase 1 - Fondations - PRÊTE À L'EMPLOI 🚀

## 📋 Résumé de la Phase 1

**Objectif:** Architecture Docker complète avec backend FastAPI, PostgreSQL, Redis, authentification JWT sécurisée, et structure modulaire.

**Statut:** ✅ COMPLÈTE

---

## 🏗️ Structure Créée

```
laundry-express-rdc/
├── apps/
│   ├── api/                          # Backend FastAPI
│   │   ├── app/
│   │   │   ├── api/                  # Routes
│   │   │   │   ├── routes/
│   │   │   │   │   ├── auth.py       # Authentification
│   │   │   │   │   └── users.py      # Gestion utilisateurs
│   │   │   │   └── __init__.py       # Router principal
│   │   │   ├── core/                 # Configuration
│   │   │   │   ├── config.py         # Variables d'environnement
│   │   │   │   └── database.py       # Base de données
│   │   │   ├── models/               # SQLAlchemy models
│   │   │   │   ├── user.py           # Utilisateurs
│   │   │   │   ├── customer.py       # Adresses clients
│   │   │   │   └── __init__.py
│   │   │   ├── schemas/              # Pydantic schemas
│   │   │   │   └── user.py
│   │   │   ├── repositories/         # Data access layer
│   │   │   │   └── user_repository.py
│   │   │   ├── services/             # Business logic
│   │   │   │   ├── auth_service.py
│   │   │   │   └── user_service.py
│   │   │   ├── workers/              # Tâches async
│   │   │   │   └── main.py
│   │   │   └── main.py               # Application FastAPI
│   │   ├── alembic/                  # Migrations
│   │   │   ├── env.py
│   │   │   ├── script.py.mako
│   │   │   └── versions/initial_migration.py
│   │   └── requirements.txt
│   │
│   └── web/                          # Frontend React (à migrer)
│       └── (structure existante à migrer)
│
├── infra/
│   ├── docker/                       # Dockerfiles
│   │   ├── api.Dockerfile
│   │   ├── worker.Dockerfile
│   │   └── web.Dockerfile
│   ├── scripts/                      # Scripts utilitaires
│   │   └── wait-for-db.sh
│   └── nginx/                        # (optionnel)
│
├── docker-compose.yml                # Configuration Docker
├── .env                              # Variables d'environnement
├── .env.example                      # Template
└── README_DOCKER.md                  # Documentation
```

---

## 🚀 Démarrage Immédiat

### 1. Démarrer tous les services
```bash
docker compose up --build
```

### 2. Accéder aux services
- **Frontend:** http://localhost:5173 (existant à migrer)
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Mailpit (Emails):** http://localhost:8025
- **Adminer (DB):** http://localhost:8080

### 3. Tester l'API
```bash
# Créer un utilisateur
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+243810000000",
    "name": "Test User",
    "password": "EXAMPLE_SECRET_FROM_ENV"
  }'

# Se connecter
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "EXAMPLE_SECRET_FROM_ENV"
  }'
```

---

## 🔐 Authentification Implémentée

### Fonctionnalités:
- ✅ **Inscription** avec validation email/téléphone
- ✅ **Connexion** avec vérification mot de passe
- ✅ **Tokens JWT** (access + refresh)
- ✅ **Rafraîchissement** automatique des tokens
- ✅ **Déconnexion** avec révocation
- ✅ **Réinitialisation** de mot de passe
- ✅ **Changement** de mot de passe
- ✅ **Rôles utilisateur** (customer, partner, admin, etc.)
- ✅ **Sécurité** bcrypt + JWT HS256

### Configuration sécurité:
- Access token: 15 minutes
- Refresh token: 7 jours
- Hash bcrypt sécurisé
- Validation stricte des inputs

---

## 🗄️ Base de Données

### Tables créées:
1. **users** - Utilisateurs avec rôles et statuts
2. **user_profiles** - Profils utilisateurs
3. **refresh_tokens** - Tokens de rafraîchissement
4. **password_reset_tokens** - Tokens de réinitialisation
5. **customer_addresses** - Adresses clients (adapté RDC)

### Migrations:
```bash
# Appliquer la migration initiale
docker compose exec api alembic upgrade head

# Créer une nouvelle migration
docker compose exec api alembic revision --autogenerate -m "description"

# Vérifier l'état
docker compose exec api alembic current
```

---

## 🔧 Architecture Technique

### Backend (FastAPI):
- **Framework:** FastAPI + SQLAlchemy 2.x + Pydantic v2
- **Base de données:** PostgreSQL avec UUID primary keys
- **Cache/Queue:** Redis pour sessions et tâches async
- **Authentification:** JWT avec refresh tokens
- **Validation:** Pydantic avec validation stricte
- **Migrations:** Alembic avec support async
- **Structure:** Clean Architecture (routes/services/repositories/schemas)

### Docker:
- **Services:** PostgreSQL, Redis, FastAPI, Worker, Mailpit, Adminer
- **Health checks:** Automatiques pour tous les services
- **Volumes:** Persistance des données PostgreSQL
- **Networking:** Réseau isolé avec communication interne

---

## 📊 API Endpoints Disponibles

### Authentification (`/api/v1/auth`):
- `POST /register` - Inscription
- `POST /login` - Connexion
- `POST /refresh` - Rafraîchir tokens
- `POST /logout` - Déconnexion
- `POST /password-reset/request` - Demande réinitialisation
- `POST /password-reset/confirm` - Confirmer réinitialisation
- `POST /change-password` - Changer mot de passe
- `GET /me` - Informations utilisateur courant

### Utilisateurs (`/api/v1/users`):
- `GET /me` - Informations complètes
- `PUT /me` - Mettre à jour
- `PUT /me/profile` - Mettre à jour profil
- `GET /me/addresses` - Liste adresses
- `POST /me/addresses` - Créer adresse
- `GET /me/addresses/{id}` - Récupérer adresse
- `PUT /me/addresses/{id}` - Mettre à jour adresse
- `DELETE /me/addresses/{id}` - Supprimer adresse
- `POST /me/addresses/{id}/set-default` - Définir par défaut

---

## 🧪 Tests Rapides

### 1. Vérifier la santé des services:
```bash
# API
curl http://localhost:8000/health

# PostgreSQL
docker compose exec db pg_isready -U laundry_user -d laundry_express

# Redis
docker compose exec redis redis-cli ping
```

### 2. Créer un admin:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@laundryexpress.cd",
    "phone": "+243811111111",
    "name": "Admin",
    "password": "ADMIN_SECRET_FROM_ENV",
    "role": "admin"
  }'
```

### 3. Tester les emails:
```bash
# Utiliser l'interface Mailpit: http://localhost:8025
# Tous les emails sont capturés localement
```

---

## 🔄 Workflow de Développement

### 1. Développement local:
```bash
# Démarrer l'environnement
docker compose up

# Accéder au shell backend
docker compose exec api bash

# Installer une dépendance
docker compose exec api pip install package_name

# Lancer les tests (à implémenter)
docker compose exec api pytest
```

### 2. Migrations:
```bash
# Après modification des modèles
docker compose exec api alembic revision --autogenerate -m "ajout_champ_xyz"
docker compose exec api alembic upgrade head
```

### 3. Débogage:
```bash
# Voir les logs
docker compose logs -f api
docker compose logs -f db
docker compose logs -f worker

# Vérifier les containers
docker compose ps

# Redémarrer un service
docker compose restart api
```

---

## 🎯 Prochaines Étapes (Phase 2)

### Priorité 1: Migration Frontend
1. **Créer `apps/web/`** avec structure feature-based
2. **Configurer Vite** avec TypeScript + React 19
3. **Migrer les composants** existants
4. **Implémenter Zustand** pour state management
5. **Créer client API** avec TanStack Query

### Priorité 2: Module Partners
1. **Modèles** Partner, PartnerLocation, PartnerService
2. **Services** de gestion partenaires
3. **Routes** API pour partenaires
4. **Dashboard** partenaire (frontend)

### Priorité 3: Module Orders
1. **Modèles** Order, OrderItem, OrderStatusHistory
2. **Services** de gestion commandes
3. **Transitions de statuts** métier
4. **Estimation de prix**

---

## ⚠️ Points d'Attention

### 1. Sécurité en production:
- Changer `SECRET_KEY` dans `.env`
- Configurer HTTPS
- Activer rate limiting
- Configurer CORS pour domaine réel
- Mettre à jour les mots de passe par défaut

### 2. Performance:
- Ajuster `pool_size` et `max_overflow` selon charge
- Configurer Redis pour cache
- Optimiser les indexes PostgreSQL

### 3. Monitoring:
- Activer les logs structurés
- Configurer health checks
- Mettre en place métriques Prometheus

---

## 🆘 Dépannage

### Problèmes courants:

1. **Ports déjà utilisés:**
   ```bash
   netstat -ano | findstr :5432  # Windows
   lsof -i :5432                 # Mac/Linux
   ```

2. **Problèmes de build:**
   ```bash
   docker compose build --no-cache
   docker compose up
   ```

3. **Base de données non accessible:**
   ```bash
   docker compose logs -f db
   docker compose exec db psql -U laundry_user -d laundry_express
   ```

4. **Permissions Docker:**
   ```bash
   # Sur Linux
   sudo usermod -aG docker $USER
   newgrp docker
   ```

---

## ✅ Checklist Phase 1

- [x] **Docker Compose** avec tous les services
- [x] **FastAPI** backend bootstrap
- [x] **PostgreSQL** avec migrations Alembic
- [x] **Redis** pour cache et queue
- [x] **Authentification JWT** complète
- [x] **Modèles** users, profiles, addresses
- [x] **Services** auth et users
- [x] **Routes** API RESTful
- [x] **Validation** Pydantic stricte
- [x] **Worker Celery** configuré
- [x] **Mailpit** pour emails locaux
- [x] **Adminer** pour administration DB
- [x] **Health checks** automatiques
- [x] **Documentation** complète
- [x] **Variables d'environnement** configurées

---

## 🚀 COMMANDES DE DÉMARRAGE

```bash
# 1. Copier les variables d'environnement
cp .env.example .env

# 2. Démarrer tous les services
docker compose up --build

# 3. Appliquer les migrations
docker compose exec api alembic upgrade head

# 4. Tester l'API
curl http://localhost:8000/health
curl http://localhost:8000/docs

# 5. Créer un utilisateur test
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+243810000000",
    "name": "Test User",
    "password": "EXAMPLE_SECRET_FROM_ENV"
  }'
```

---

**✨ La Phase 1 est terminée et prête à l'emploi !**  
Prochaine étape: Migration du frontend existant vers la nouvelle architecture. 🎯
