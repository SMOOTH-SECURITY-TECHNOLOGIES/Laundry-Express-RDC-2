# Tests MVP Audit

Date: 2026-03-18
Objectif: réduire la suite d'intégration à un noyau qui protège quelque chose de réel.

## Verdict

- La suite d'intégration historique n'est pas une safety net fiable.
- Une partie des fichiers dépend d'un environnement async non disponible localement.
- Une autre partie valide un contrat qui n'existe plus.
- Le noyau à garder immédiatement est inférieur à 20 tests et centré sur `auth`, `orders`, `pricing`, `payments`.

## Ce qui est gardé maintenant

### Suite MVP active

| Fichier | Nombre | Rôle |
|---|---:|---|
| `apps/api/tests/integration/test_routes_exist.py` | 4 | gate minimale de présence des routes MVP |
| `apps/api/tests/integration/test_orders_stability_real.py` | 4 | preuve réelle locale sur idempotence, concurrence, rollback, garde-fou paiement |

Total actuel: `8 tests`

### Pourquoi ces tests restent

- Ils décrivent le backend réel actuel.
- Ils ciblent les flows ou points de casse qui comptent pour le MVP.
- Ils ne s'appuient pas sur des routes fantômes.

## Ce qui est mis en quarantaine

| Fichier | Verdict | Evidence |
|---|---|---|
| `apps/api/tests/integration/test_auth_integration.py` | `QUARANTINED` | dépend de `pytest_asyncio` absent localement et d'un setup DB async couplé à l'environnement |
| `apps/api/tests/integration/test_orders_integration.py` | `QUARANTINED` | la fixture `db()` retourne `None`; le fichier ne peut pas prouver un flow Orders |
| `apps/api/tests/integration/test_payments_integration.py` | `QUARANTINED` | route map et modèles faux par rapport au backend réel |
| `apps/api/tests/integration/test_payments_integration_fixed.py` | `QUARANTINED` | dépend de `pytest_asyncio` et continue d'utiliser des hypothèses de modèle dépassées |
| `apps/api/tests/integration/test_marketplace_integration.py` | `QUARANTINED` | hors MVP et basé sur des champs qui ont dérivé |

## Evidence d'exécution

### Collecte/Auth

`pytest tests/integration/test_auth_integration.py -q`

Résultat:
- erreur de collecte
- `ModuleNotFoundError: No module named 'pytest_asyncio'`

### Orders historique

`pytest tests/integration/test_orders_integration.py -q`

Résultat:
- `5 errors`
- cause directe: `db.add(...)` sur `db is None`

### Payments historique

`pytest tests/integration/test_payments_integration_fixed.py -q`

Résultat:
- erreur de collecte
- `ModuleNotFoundError: No module named 'pytest_asyncio'`

## Règle de passage

On continue avec ce noyau seulement:
- routes MVP présentes
- stabilité Orders réelle

On ne réactive pas les fichiers en quarantaine avant:
1. contrat API figé
2. stratégie de fixtures canonique
3. environnement de test cohérent

## Étape suivante correcte

Créer le smoke test client réel:
- `register`
- `login`
- `me`
- `pricing`
- `create order`
- `payment intent`
- `confirm cash`

Tant que ce smoke test n'est pas vert, le frontend ne doit pas redevenir la cible principale.
