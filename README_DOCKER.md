# Laundry Express RDC - Docker Setup

## Architecture Docker Complète

Ce projet utilise Docker Compose pour fournir un environnement de développement complet avec :

- **Frontend React** (Vite + TypeScript)
- **Backend FastAPI** (Python 3.12)
- **PostgreSQL** (Base de données)
- **Redis** (Cache + Queue)
- **Worker Celery** (Tâches asynchrones)
- **Mailpit** (Email catcher local)
- **Adminer** (Interface d'administration DB)
- **Nginx** (Reverse proxy optionnel)

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose v2+
- Git

### 2. Cloner et configurer
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables si nécessaire
# nano .env  # ou utiliser VS Code
```

### 3. Démarrer tous les services
```bash
docker compose up --build
```

### 4. Accéder aux services
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Mailpit (Emails):** http://localhost:8025
- **Adminer (DB):** http://localhost:8080
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

---

## 📁 Structure du Projet

```
laundry-express-rdc/
├── apps/
│   ├── web/                 # Frontend React
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                 # Backend FastAPI
│       ├── app/
│       │   ├── api/         # Routes
│       │   ├── core/        # Configuration
│       │   ├── models/      # SQLAlchemy models
│       │   ├── schemas/     # Pydantic schemas
│       │   ├── services/    # Business logic
│       │   └── workers/     # Tâches async
│       ├── alembic/         # Migrations
│       └── requirements.txt
│
├── infra/
│   ├── docker/              # Dockerfiles
│   ├── scripts/             # Scripts utilitaires
│   └── nginx/               # Configuration Nginx
│
├── docker-compose.yml       # Configuration Docker
├── .env.example             # Variables d'environnement
└── README_DOCKER.md         # Ce fichier
```

---

## 🔧 Commandes Utiles

### Gestion des services
```bash
# Démarrer tous les services
docker compose up

# Démarrer en arrière-plan
docker compose up -d

# Arrêter tous les services
docker compose down

# Reconstruire et démarrer
docker compose up --build

# Voir les logs
docker compose logs -f
docker compose logs -f api   # Logs spécifiques au service
```

### Base de données
```bash
# Exécuter les migrations
docker compose exec api alembic upgrade head

# Créer une nouvelle migration
docker compose exec api alembic revision --autogenerate -m "description"

# Accéder à PostgreSQL
docker compose exec db psql -U laundry_user -d laundry_express

# Backup de la base de données
docker compose exec db pg_dump -U laundry_user laundry_express > backup.sql
```

### Développement
```bash
# Accéder au shell du backend
docker compose exec api bash

# Accéder au shell du frontend
docker compose exec web sh

# Installer une dépendance Python
docker compose exec api pip install package_name

# Installer une dépendance Node.js
docker compose exec web npm install package_name

# Lancer les tests backend
docker compose exec api pytest

# Lancer les tests frontend
docker compose exec web npm test
```

### Nettoyage
```bash
# Supprimer tous les containers, volumes et networks
docker compose down -v --remove-orphans

# Nettoyer les images non utilisées
docker image prune -a

# Nettoyer les volumes non utilisés
docker volume prune
```

---

## 🗄️ Base de Données

### Connexion
- **Host:** `db` (dans Docker) ou `localhost` (depuis l'hôte)
- **Port:** `5432`
- **Database:** `laundry_express`
- **Username:** `laundry_user`
- **Password:** `laundry_pass`

### Administration
1. **Adminer:** http://localhost:8080
   - System: PostgreSQL
   - Server: `db`
   - Username: `laundry_user`
   - Password: `laundry_pass`
   - Database: `laundry_express`

2. **Command line:**
   ```bash
   docker compose exec db psql -U laundry_user -d laundry_express
   ```

### Migrations
Les migrations sont gérées avec Alembic:
```bash
# Appliquer toutes les migrations
docker compose exec api alembic upgrade head

# Revenir à une version précédente
docker compose exec api alembic downgrade -1

# Voir l'historique des migrations
docker compose exec api alembic history
```

---

## 📧 Email Local (Mailpit)

Mailpit capture tous les emails envoyés par l'application:

- **Interface web:** http://localhost:8025
- **SMTP server:** `mailpit:1025` (dans Docker) ou `localhost:1025` (depuis l'hôte)

### Configuration dans `.env`
```env
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=no-reply@laundryexpress.cd
```

---

## 🔐 Authentification & Sécurité

### JWT Tokens
- **Access token:** 15 minutes
- **Refresh token:** 7 jours
- **Algorithm:** HS256

### Configuration de sécurité
```env
# Générer une nouvelle clé secrète
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Durée des tokens
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Créer un admin
```bash
# Via l'API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@laundryexpress.cd",
    "password": "votre_mot_de_passe",
    "name": "Admin",
    "role": "admin"
  }'
```

---

## 🚚 Tâches Asynchrones (Worker)

Le worker Celery gère:
- Envoi d'emails
- Notifications
- Traitement d'images IA
- Callbacks de paiement
- Nettoyage de données

### Commandes du worker
```bash
# Voir les logs du worker
docker compose logs -f worker

# Redémarrer le worker
docker compose restart worker

# Exécuter une tâche de test
docker compose exec api python -c "from app.workers.tasks import test_task; test_task.delay()"
```

---

## 🐛 Débogage

### Problèmes courants

1. **Ports déjà utilisés:**
   ```bash
   # Vérifier les ports utilisés
   netstat -ano | findstr :5432  # Windows
   lsof -i :5432                 # Mac/Linux
   ```

2. **Problèmes de connexion DB:**
   ```bash
   # Vérifier si PostgreSQL est accessible
   docker compose exec db pg_isready -U laundry_user -d laundry_express
   
   # Vérifier les logs de la DB
   docker compose logs -f db
   ```

3. **Problèmes de build:**
   ```bash
   # Nettoyer et reconstruire
   docker compose build --no-cache
   docker compose up
   ```

4. **Permissions Docker:**
   ```bash
   # Sur Linux, ajouter l'utilisateur au groupe docker
   sudo usermod -aG docker $USER
   newgrp docker
   ```

### Logs détaillés
```bash
# Tous les logs
docker compose logs --tail=100 -f

# Logs spécifiques
docker compose logs --tail=50 -f api
docker compose logs --tail=50 -f db
docker compose logs --tail=50 -f web
```

---

## 🧪 Tests

### Backend (FastAPI)
```bash
# Lancer tous les tests
docker compose exec api pytest

# Lancer les tests avec coverage
docker compose exec api pytest --cov=app --cov-report=html

# Lancer un test spécifique
docker compose exec api pytest tests/test_auth.py -v

# Lancer les tests en watch mode
docker compose exec api ptw --runner "pytest -v"
```

### Frontend (React)
```bash
# Lancer les tests
docker compose exec web npm test

# Lancer les tests en watch mode
docker compose exec web npm test -- --watch

# Lancer les tests avec coverage
docker compose exec web npm test -- --coverage
```

### Tests d'intégration
```bash
# Lancer les tests d'intégration
docker compose exec api pytest tests/integration/ -v

# Lancer les tests avec une DB propre
docker compose exec api pytest tests/integration/ --recreate-db
```

---

## 🚀 Déploiement

### Préparation pour la production
1. **Mettre à jour `.env`:**
   ```env
   APP_ENV=production
   SECRET_KEY=votre_clé_secrète_complexe
   ALLOWED_HOSTS=votre-domaine.com,api.votre-domaine.com
   CORS_ORIGINS=https://votre-domaine.com
   ```

2. **Configurer la base de données:**
   ```env
   POSTGRES_PASSWORD=mot_de_passe_complexe
   DATABASE_URL=postgresql+psycopg://user:password@host:port/dbname
   ```

3. **Configurer l'email:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=votre-email@gmail.com
   SMTP_PASSWORD=votre-mot-de-passe-app
   ```

### Build pour production
```bash
# Build les images
docker compose -f docker-compose.prod.yml build

# Démarrer en production
docker compose -f docker-compose.prod.yml up -d
```

### Monitoring
```bash
# Vérifier l'état des services
docker compose ps

# Vérifier l'utilisation des ressources
docker stats

# Vérifier les logs en production
docker compose logs --tail=100 -f api
```

---

## 📊 Monitoring & Observabilité

### Health checks
- **API:** http://localhost:8000/health
- **Frontend:** http://localhost:5173 (automatique)

### Métriques Prometheus (optionnel)
```bash
# Activer dans .env
PROMETHEUS_ENABLED=true

# Accéder aux métriques
curl http://localhost:8000/metrics
```

### Logs structurés
Les logs sont au format JSON pour une meilleure intégration avec:
- ELK Stack
- Loki + Grafana
- CloudWatch
- Datadog

---

## 🔄 Workflow de Développement

### 1. Nouvelle fonctionnalité
```bash
# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# Démarrer l'environnement
docker compose up

# Développer et tester
# ... votre code ...

# Lancer les tests
docker compose exec api pytest
docker compose exec web npm test

# Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
```

### 2. Migration de base de données
```bash
# Créer une migration
docker compose exec api alembic revision --autogenerate -m "ajout_table_xyz"

# Appliquer la migration
docker compose exec api alembic upgrade head

# Vérifier la migration
docker compose exec api alembic current
```

### 3. Déploiement en staging
```bash
# Mettre à jour les variables d'environnement
# Déployer avec votre outil CI/CD
# Vérifier les health checks
# Tester les fonctionnalités
```

---

## 🆘 Support & Dépannage

### Ressources
- **Documentation FastAPI:** https://fastapi.tiangolo.com/
- **Documentation SQLAlchemy:** https://docs.sqlalchemy.org/
- **Documentation Docker:** https://docs.docker.com/
- **Issues GitHub:** [Lien vers le repo]

### Problèmes connus
1. **Problèmes de volume sur Windows:**
   - Activer le partage de fichiers dans Docker Desktop
   - Ajouter le chemin du projet aux shared drives

2. **Performance lente sur Windows/Mac:**
   - Augmenter les ressources Docker (RAM/CPU)
   - Utiliser WSL2 sur Windows

3. **Problèmes de réseau:**
   - Vérifier les pare-feux
   - Vérifier les conflits de ports

### Obtenir de l'aide
```bash
# Afficher la version de Docker
docker --version
docker compose version

# Afficher l'état des services
docker compose ps

# Afficher les logs d'erreur
docker compose logs --tail=50 | grep -i error
```

---

## 📝 Notes Importantes

### Pour le développement
1. **Hot reload:** Activé pour le frontend et backend
2. **Base de données:** Les données persistent dans un volume Docker
3. **Emails:** Capturés localement par Mailpit
4. **Tests:** Exécutables dans l'environnement Docker

### Pour la production
1. **Sécurité:** Mettre à jour toutes les variables sensibles
2. **Monitoring:** Configurer les alertes et logs
3. **Backup:** Mettre en place une stratégie de backup
4. **Scale:** Ajuster les ressources selon la charge

### Bonnes pratiques
1. Toujours utiliser `.env` pour les configurations
2. Versionner les migrations de base de données
3. Tester dans l'environnement Docker avant le déploiement
4. Monitorer les health checks régulièrement

---

## 🎯 Prochaines Étapes

### Immédiates
1. [ ] Configurer l'authentification JWT
2. [ ] Implémenter les modèles de base
3. [ ] Créer les premières migrations
4. [ ] Connecter le frontend à l'API

### Court terme
1. [ ] Système de commandes
2. [ ] Gestion des partenaires
3. [ ] Logistique et chauffeurs
4. [ ] Paiements mobiles

### Moyen terme
1. [ ] Notifications multi-canaux
2. [ ] IA pour analyse d'articles
3. [ ] Dashboard admin
4. [ ] Analytics et reporting

---

**✨ Votre environnement Docker est prêt !**  
Commencez par `docker compose up` et développez votre plateforme Laundry Express RDC 🚀