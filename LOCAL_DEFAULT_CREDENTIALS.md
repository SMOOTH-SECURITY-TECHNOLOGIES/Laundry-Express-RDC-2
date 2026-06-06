# Local Default Credentials

Ce document décrit les identifiants locaux réellement seedés par le projet.

## Commande

```bash
python apps/api/scripts/seed_default_credentials.py
```

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

## Comptes seedés

| Rôle | Email | Mot de passe | Notes |
|------|-------|--------------|-------|
| `SUPER_ADMIN` | `admin@laundryexpress.cd` | `SUPER_ADMIN_PASSWORD` via env | Compte bootstrap local |
| `ADMIN` | `settings.ADMIN_EMAIL` | `settings.ADMIN_PASSWORD` | Créé seulement si l'email diffère du super admin |
| `CUSTOMER` | `test@example.com` | `SEED_CUSTOMER_PASSWORD` via env | Client local standard |
| `CUSTOMER` | `inactive@example.com` | `password` | Compte inactif |
| `CUSTOMER` | `new@example.com` | `SEED_NEW_CUSTOMER_PASSWORD` via env | Compte client supplémentaire |
| `PARTNER_OWNER` | `owner@partner.com` | `SEED_PARTNER_OWNER_PASSWORD` via env | Relié au partenaire de test |
| `PARTNER_STAFF` | `staff@partner.com` | `SEED_PARTNER_STAFF_PASSWORD` via env | Relié au partenaire de test |
| `DRIVER` | `driver@laundryexpress.cd` | `SEED_DRIVER_PASSWORD` via env | Chauffeur local |
| `LOGISTICS_MANAGER` | `logistics@laundryexpress.cd` | `SEED_LOGISTICS_PASSWORD` via env | Manager logistique local |

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

## Sécurité

Ces identifiants sont uniquement pour bootstrap local / dev / QA.

À changer avant tout usage staging ou production:
- `SECRET_KEY`
- `ADMIN_PASSWORD`
- `SUPER_ADMIN_PASSWORD`
- tous les mots de passe par défaut
