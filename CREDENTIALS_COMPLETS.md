# 📋 CREDENTIALS COMPLETS - LAUNDRY EXPRESS SRC 2

## 🔐 **STRUCTURE DES RÔLES**

| Rôle | Description | Accès |
|------|-------------|-------|
| **SUPER_ADMIN** | Administrateur suprême | Toutes les permissions système |
| **ADMIN** | Administrateur plateforme | Gestion complète (sans permissions système) |
| **PARTNER_OWNER** | Propriétaire partenaire | Dashboard partenaire + gestion équipe |
| **PARTNER_STAFF** | Staff partenaire | Accès limité dashboard partenaire |
| **LOGISTICS_MANAGER** | Manager logistique | Gestion chauffeurs + tracking |
| **DRIVER** | Chauffeur | Application mobile chauffeur |
| **CUSTOMER** | Client | Application client + commandes |

---

## 🏛️ **1. ADMINISTRATEURS (BACKEND)**

### **Super Administrateur** (Créé par script)
```bash
# Email: admin@laundryexpress.cd
# Mot de passe: fourni via `SUPER_ADMIN_PASSWORD`
# Téléphone: +243810000000
# Nom: "Super Administrateur"
```

**Script de création** :
```bash
cd "c:\Users\PC\OneDrive\Desktop\Laundry-Express-RDC-2"
python apps/api/scripts/create_super_admin.py
```

### **Administrateur Plateforme** (Configuration .env)
```bash
# Email: admin@laundryexpress.cd (configuré mais non créé automatiquement)
# Mot de passe: fourni explicitement via `ADMIN_PASSWORD`
```

**Variables d'environnement** (.env) :
```bash
ADMIN_EMAIL=admin@laundryexpress.cd
ADMIN_PASSWORD=<set-explicitly>
SUPER_ADMIN_EMAILS=admin@laundryexpress.cd
```

---

## 🤝 **2. PARTENAIRES (LAVERIES / PRESSINGS)**

### **Structure des partenaires** :
```python
# Types de partenaires :
# - LAUNDRY (Laverie)
# - PRESSING (Pressing)
# - DRY_CLEANING (Nettoyage à sec)
# - MULTI_SERVICE (Multi-services)

# Statuts :
# - PENDING (En attente)
# - ACTIVE (Actif)
# - SUSPENDED (Suspendu)
# - UNDER_REVIEW (En révision)
```

### **Credentials de test partenaire** :
```python
# Modèle de test dans les fixtures
Partner(
    name="Test Partner",
    business_name="Test Partner Business",
    email="partner@test.com",
    phone="+243810000001",
    partner_type="laundry",
    status="active",
    is_verified=True
)
```

### **Staff partenaire** (via User avec rôle) :
```python
# User avec rôle PARTNER_OWNER ou PARTNER_STAFF
User(
    email="owner@partner.com",
    phone="+243810000002",
    name="Partner Owner",
    role=UserRole.PARTNER_OWNER,
    password_hash="[bcrypt hash]"
)
```

---

## 👥 **3. UTILISATEURS (CLIENTS)**

### **Utilisateur de test standard** :
```python
# Fixture de test (test_auth_service.py)
User(
    email="test@example.com",
    phone="+243810000001",
    name="Test User",
    role=UserRole.CUSTOMER,
    password_hash="$2b$12$hashedpassword"  # bcrypt d'un secret de test isole
)

# Mot de passe: fourni via `SEED_CUSTOMER_PASSWORD`
```

### **Données de connexion pour tests** :
| Type | Email | Mot de passe | Rôle |
|------|-------|--------------|------|
| **Client standard** | `test@example.com` | `SEED_CUSTOMER_PASSWORD` via env | CUSTOMER |
| **Client inactif** | `inactive@example.com` | `password` | CUSTOMER (inactive) |
| **Nouveau client** | `new@example.com` | `SEED_NEW_CUSTOMER_PASSWORD` via env | CUSTOMER |

### **Fixtures de test d'intégration** :
```python
# test_auth_integration.py - Utilisateur généré automatiquement
email = f"test_{uuid4().hex[:8]}@example.com"
password = os.getenv("SEED_CUSTOMER_PASSWORD")
```

---

## 🚚 **4. LOGISTIQUE (CHAUFFEURS)**

### **Driver credentials Kin Express** :
```python
# Rôle: DRIVER
drivers = [
    ("driver1@kinexpress.cd", "Driver Kabila", "+243831111111"),
    ("driver2@kinexpress.cd", "Driver Mfumu", "+243832222222"),
    ("driver3@kinexpress.cd", "Driver Tshisekedi", "+243833333333"),
]

# Mot de passe local par defaut: driverpass123
# Chaque compte est relie au profil backend Driver et a Kin Express Logistics.

# Application mobile chauffeur:
# - Endpoint: /api/v1/logistics/drivers/
# - Permissions: pickup/delivery orders, status updates
```

### **Logistics Manager** :
```python
# Rôle: LOGISTICS_MANAGER
User(
    email="logistics@laundryexpress.cd",
    phone="+243810000004",
    name="Logistics Manager",
    role=UserRole.LOGISTICS_MANAGER
)
```

---

## 🔑 **5. TOKENS & AUTHENTIFICATION**

### **Token de test pour API** :
```python
# Utilisé dans les tests d'intégration
headers = {"Authorization": f"Bearer {settings.TEST_TOKEN}"}

# Note: TEST_TOKEN n'est pas défini dans les variables d'environnement
# Les tests utilisent probablement un token généré dynamiquement
```

### **Configuration JWT** :
```bash
# .env / config.py
SECRET_KEY=<set-explicit-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30
```

---

## 🧪 **6. CREDENTIALS POUR TESTS AUTOMATISÉS**

### **Base de données de test** :
```bash
# docker-compose.yml
POSTGRES_DB=laundry_express
POSTGRES_USER=laundry_user
POSTGRES_PASSWORD=laundry_pass
POSTGRES_HOST=db
POSTGRES_PORT=5432

# URL de connexion:
DATABASE_URL=postgresql+asyncpg://laundry_user:laundry_pass@db:5432/laundry_express
```

### **Redis pour cache/queue** :
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0
```

### **Email (Mailpit local)** :
```bash
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM=no-reply@laundryexpress.cd
# Pas d'authentification en local
```

---

## 📊 **7. MATRICE DES PERMISSIONS PAR RÔLE**

| Permission | SUPER_ADMIN | ADMIN | PARTNER_OWNER | CUSTOMER | DRIVER |
|------------|-------------|-------|---------------|----------|---------|
| **Gestion utilisateurs** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Gestion partenaires** | ✅ Full | ✅ Full | ✅ Own only | ❌ | ❌ |
| **Gestion commandes** | ✅ Full | ✅ Full | ✅ Own orders | ✅ Own orders | ✅ Assigned |
| **Gestion paiements** | ✅ Full | ✅ Full | ✅ View only | ✅ Own | ❌ |
| **Dashboard admin** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Dashboard partenaire** | ✅ View | ✅ View | ✅ Full | ❌ | ❌ |
| **Application chauffeur** | ❌ | ❌ | ❌ | ❌ | ✅ Full |
| **API complète** | ✅ Full | ✅ Most | ✅ Limited | ✅ Limited | ✅ Limited |

---

## 🚀 **8. COMMANDES DE CRÉATION & VÉRIFICATION**

### **Créer super administrateur** :
```bash
cd "c:\Users\PC\OneDrive\Desktop\Laundry-Express-RDC-2"
python apps/api/scripts/create_super_admin.py
```

### **Vérifier credentials admin** :
```bash
# 1. Vérifier email admin dans .env
cat .env | findstr ADMIN_EMAIL ADMIN_PASSWORD

# 2. Vérifier dans config Python
python -c "from app.core.config import settings; print(f'Admin: {settings.ADMIN_EMAIL}')"
```

### **Créer utilisateur de test via API** :
```bash
# Endpoint: POST /api/v1/auth/register
curl -X POST http://localhost:18000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+243810000001",
    "name": "Test User",
    "password": "<provided-by-env>",
    "role": "customer"
  }'
```

### **Se connecter** :
```bash
curl -X POST http://localhost:18000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "<provided-by-env>"
  }'
```

---

## ⚠️ **9. SÉCURITÉ & BEST PRACTICES**

### **À CHANGER EN PRODUCTION** :
1. ✅ `SECRET_KEY` dans .env (fourni explicitement par environnement)
2. ✅ `ADMIN_PASSWORD` fourni explicitement
3. ✅ Mot de passe super admin fourni explicitement
4. ✅ Credentials base de données
5. ✅ Activer rate limiting (actuel: `RATE_LIMIT_ENABLED=false`)

### **Recommandations** :
```bash
# 1. Générer une SECRET_KEY sécurisée
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Changer tous les mots de passe par défaut
# 3. Activer 2FA pour les admins
# 4. Limiter les tentatives de connexion
# 5. Audit régulier des logs d'accès
```

---

## 📝 **10. RÉSUMÉ EXÉCUTIF**

### **Credentials par défaut** :
| Rôle | Email | Mot de passe | Statut |
|------|-------|--------------|--------|
| **Super Admin** | `admin@laundryexpress.cd` | `SUPER_ADMIN_PASSWORD` via env | À créer via script |
| **Admin Plateforme** | `admin@laundryexpress.cd` | `ADMIN_PASSWORD` via env | Configuré explicitement |
| **Client Test** | `test@example.com` | `SEED_CUSTOMER_PASSWORD` via env | Fixture de test |
| **Partenaire Test** | `partner@test.com` | - | Fixture de test |

### **Points d'accès** :
- **Frontend** : http://localhost:3003 (React/Vite)
- **Backend API** : http://localhost:18000 (FastAPI)
- **Adminer DB** : http://localhost:8080 (PostgreSQL UI)
- **Mailpit** : http://localhost:8025 (Email testing)
- **Swagger Docs** : http://localhost:18000/docs

### **Prochaines étapes** :
1. **Créer le super admin** via le script Python
2. **Changer tous les mots de passe** par défaut
3. **Configurer les partenaires** réels via l'interface admin
4. **Auditer les permissions** par rôle
5. **Mettre en place** monitoring des accès

---

## 🔗 **RESSOURCES**

- **Documentation API** : `http://localhost:18000/docs`
- **Schéma DB** : `DATABASE_SCHEMA.md`
- **Scripts admin** : `apps/api/scripts/`
- **Tests d'intégration** : `apps/api/tests/integration/`
- **Modèles utilisateurs** : `apps/api/app/models/user.py`
