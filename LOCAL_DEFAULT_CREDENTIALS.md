# Local Default Credentials

Ce document décrit les identifiants locaux réellement seedés par le projet.

## Commande

```bash
python apps/api/scripts/seed_default_credentials.py
```

Les scripts `verify_seeded_credentials.py` et `local_test_credentials.py` **chargent automatiquement** le fichier `.env` à la racine du projet.

Si la vérification échoue avec `SEED_SUPER_ADMIN_PASSWORD is required`, ajoute le bloc **Seed credentials** dans ton `.env` (voir section ci-dessous) puis relance le seed.

Si tu lances le script depuis l'hôte Windows avec le `docker compose` local actuel, utilise la base exposée:

```powershell
$env:DATABASE_URL='postgresql+asyncpg://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express'
$env:DATABASE_URL_SYNC='postgresql://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express'
python apps/api/scripts/seed_default_credentials.py
```

Overrides utiles:

```powershell
$env:SEED_DATABASE_URL_SYNC='postgresql://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express'
$env:SEED_SUPER_ADMIN_PASSWORD='<set-local-super-admin-password>'
python apps/api/scripts/seed_default_credentials.py
```

Le script est idempotent:
- il crée les comptes manquants
- il remet à jour rôle, statut, téléphone et mot de passe si le compte existe déjà
- il crée aussi le partenaire de test et les liens `partner_staff`
- si un téléphone seedé est déjà pris par un autre email, il alloue automatiquement le prochain numéro libre
- il n'affiche plus les mots de passe seedés en clair dans la sortie console

## Vérification

```bash
python scripts/verify_seeded_credentials.py
```

ou

```bash
npm run test:seeded-credentials
```

La vérification confirme:
- login valide pour les rôles seedés actifs
- rôle retourné par `/auth/me`
- rejet du compte `inactive@example.com`

## Contrôle minimal d'autorisations

```bash
python scripts/verify_role_access_matrix.py
```

ou

```bash
npm run test:role-access
```

La gate vérifie aujourd'hui:
- lecture admin d'un utilisateur par `super_admin`
- refus `403` d'un client sur une route admin
- création de commande et d'intention de paiement par un client
- refus `403` du client sur `confirm-cash`
- succès `200` du `partner_owner` sur `confirm-cash`

## Vérité actuelle

Le backend supporte réellement ces rôles:
- `super_admin`
- `admin`
- `partner_owner`
- `partner_staff`
- `logistics_manager`
- `driver`
- `customer`

## Variables `.env` (mots de passe locaux)

Ajoute dans ton `.env` à la racine :

```env
SEED_DEFAULT_PASSWORD=local-dev-admin-password
SEED_SUPER_ADMIN_PASSWORD=local-dev-admin-password
SEED_PLATFORM_ADMIN_PASSWORD=local-dev-admin-password
SEED_CUSTOMER_PASSWORD=local-dev-customer-password
SEED_INACTIVE_CUSTOMER_PASSWORD=password
SEED_NEW_CUSTOMER_PASSWORD=local-dev-customer-password
SEED_PARTNER_OWNER_PASSWORD=local-dev-partner-password
SEED_PARTNER_STAFF_PASSWORD=local-dev-partner-password
SEED_LOGISTICS_PASSWORD=local-dev-logistics-password
SEED_LOGISTICS_2_PASSWORD=local-dev-logistics-password
```

Puis synchronise la base :

```bash
docker compose exec api python scripts/seed_default_credentials.py
```

Ensuite :

```bash
python scripts/verify_seeded_credentials.py
```

## Comptes seedés

| Rôle | Email | Mot de passe | Notes |
|------|-------|--------------|-------|
| `SUPER_ADMIN` | `admin@laundryexpress.cd` | `local-dev-admin-password` | Ou `SEED_SUPER_ADMIN_PASSWORD` / `ADMIN_PASSWORD` |
| `ADMIN` | `settings.ADMIN_EMAIL` | `local-dev-admin-password` | Créé seulement si l'email diffère du super admin |
| `CUSTOMER` | `test@example.com` | `local-dev-customer-password` | Client local standard |
| `CUSTOMER` | `inactive@example.com` | `password` | Compte inactif |
| `CUSTOMER` | `new@example.com` | `local-dev-customer-password` | Compte client supplémentaire |
| `PARTNER_OWNER` | `owner@partner.com` | `local-dev-partner-password` | Relié au partenaire de test |
| `PARTNER_STAFF` | `staff@partner.com` | `local-dev-partner-password` | Relié au partenaire de test |
| `DRIVER` | `driver1@kinexpress.cd` | `driverpass123` | Chauffeur Kin Express |
| `DRIVER` | `driver2@kinexpress.cd` | `driverpass123` | Chauffeur Kin Express |
| `DRIVER` | `driver3@kinexpress.cd` | `driverpass123` | Chauffeur Kin Express |
| `DRIVER` | `driver4@rapidcourrier.cd` | `driverpass123` | Chauffeur Rapid Courrier RDC |
| `LOGISTICS_MANAGER` | `logistics@laundryexpress.cd` | `local-dev-logistics-password` | Manager Kin Express Logistics |
| `LOGISTICS_MANAGER` | `logistics2@rapidcourrier.cd` | `local-dev-logistics-password` | Manager Rapid Courrier RDC |

Les chauffeurs Kin Express (`driver1` à `driver3`) sont reliés à **Kin Express Logistics**.
Le chauffeur `driver4@rapidcourrier.cd` est relié à **Rapid Courrier RDC**.
Les communes **Gombe** et **Limete** sont couvertes par les deux compagnies pour tester le marketplace (first-claim-wins).

## Partenaire seedé

Le script crée aussi:

| Type | Valeur |
|------|--------|
| Nom | `Test Partner` |
| Business name | `Test Partner Business` |
| Email | `partner@test.com` |
| Téléphone | `+243810000005` |
| Type | `laundry` |
| Statut | `active` |

## Contradiction importante résolue explicitement

`users.email` est unique.

Donc `SUPER_ADMIN` et `ADMIN` ne peuvent pas utiliser le même email comme deux comptes distincts.

Comportement du script:
- si `ADMIN_EMAIL != admin@laundryexpress.cd`, le script crée un compte `ADMIN` séparé
- si `ADMIN_EMAIL == admin@laundryexpress.cd`, le script conserve un seul compte avec le rôle `SUPER_ADMIN`

## Vérification logistique (gates E2E)

| Commande | Rôle |
|----------|------|
| `npm run test:logistics-self-service-gate` | 5 tests sécurité multi-tenant (HTTP) |
| `npm run test:driver-operational-corridor` | Gate unifiée : self-service + mission complète sans admin + invariants DB |

Prérequis : API Docker sur `:18000`, Postgres sur `:5434`, `.env` chargé (mots de passe seed).

Depuis l'hôte (Python + SQLAlchemy installés) :

```bash
python scripts/verify_driver_operational_corridor.py
```

Depuis le container API (recommandé si SQLAlchemy absent sur l'hôte) :

```bash
docker compose exec \
  -e API_BASE_URL=http://127.0.0.1:8000/api/v1 \
  -e API_SMOKE_DATABASE_URL=postgresql://laundry_user:laundry_pass@db:5432/laundry_express \
  api python /app/verify_driver_operational_corridor.py
```

(Copier d'abord les scripts `scripts/verify_*.py` et `scripts/local_test_credentials.py` vers `/app/` si le dossier `scripts/` n'est pas monté.)

Verdict attendu : **DRIVER OPERATIONAL CORRIDOR : PASS**.

## Sécurité

Ces identifiants sont uniquement pour bootstrap local / dev / QA.

À changer avant tout usage staging ou production:
- `SECRET_KEY`
- `ADMIN_PASSWORD`
- `SUPER_ADMIN_PASSWORD`
- tous les mots de passe par défaut
