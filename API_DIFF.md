# API Diff

Date: 2026-03-18
But: lister les divergences qui empêchent de traiter le frontend, les tests ou le staging comme fiables tant qu'elles ne sont pas résolues ou explicitement assumées.

## Verdict global

- Le backend expose les routes MVP nécessaires.
- Les anciens documents de contrat sont faux sur plusieurs points critiques.
- Le frontend contient des hypothèses contractuelles erronées.
- Certaines routes réelles existent mais leur implémentation porte encore des risques de casse.

## Route existante

Ces routes existent réellement côté backend et peuvent servir de base aux prochains tests MVP:

| Domaine | Route réelle | Statut |
|---|---|---|
| `auth` | `POST /api/v1/auth/register` | OK |
| `auth` | `POST /api/v1/auth/login` | OK |
| `auth` | `GET /api/v1/auth/me` | OK |
| `users` | `GET /api/v1/users/me` | OK |
| `pricing` | `POST /api/v1/pricing/estimate` | OK |
| `orders` | `POST /api/v1/orders` | OK |
| `orders` | `POST /api/v1/orders/estimate` | OK |
| `payments` | `POST /api/v1/payments/intents` | OK |
| `payments` | `POST /api/v1/payments/intents/{intent_id}/confirm-cash` | OK |
| `payments` | `GET /api/v1/payments/orders/{order_id}/summary` | OK |

## Route manquante

Ces routes sont supposées par le frontend ou les anciens documents, mais n'existent pas sous cette forme:

| Type | Hypothèse | Réalité backend | Sévérité | Fix minimal |
|---|---|---|---|---|
| frontend | `GET /api/v1/health` | la route santé est hors préfixe API | P1 | corriger `healthCheck()` |
| frontend | `GET /api/v1/refunds/customers/{customerId}/requests` | il existe `GET /api/v1/refunds/orders/{order_id}/requests` et `GET /api/v1/refunds/requests` | P1 | aligner frontend sur les routes réelles |
| ancienne doc | `/api/v1/orders/orders` | la vraie route est `/api/v1/orders` | P0 | corriger docs, tests et scripts |
| ancienne doc | `/api/v1/orders/orders/estimate` | la vraie route est `/api/v1/orders/estimate` | P0 | corriger docs, tests et scripts |

## Route fantôme dans les tests, docs ou hypothèses UI

Ces points ne sont pas forcément des routes absentes, mais des contrats faux qui créent le même effet opérationnel qu'une route fantôme.

| Zone | Hypothèse fausse | Vérité actuelle | Sévérité | Fix minimal |
|---|---|---|---|---|
| docs | `GET /auth/me` retourne `UserResponse` | retourne `UserWithProfileResponse` | P0 | réaligner docs/tests/frontend |
| frontend | `login` retourne `{ access_token, refresh_token, expires_in, user }` | retourne `TokenResponse` sans `user` | P0 | faire `login` puis `GET /auth/me` |
| frontend | `getCurrentUser()` retourne un `User` plat | retourne `{ user, profile, addresses }` | P0 | corriger type frontend |
| frontend | `GET /orders` retourne `Order[]` | retourne `OrderListResponse` avec enveloppe | P0 | corriger client et composants |
| frontend | `estimateOrderPrice()` retourne `breakdown[]` | `/orders/estimate` retourne `calculation_breakdown` et totaux | P1 | réaligner le type de réponse |
| frontend | `User` a `is_active` | le backend expose `status` et flags de vérification | P1 | corriger typage frontend |
| backend schema | `POST /users/me/addresses` doit connaître `user_id` côté client | la route cible déjà l'utilisateur courant | P1 | retirer `user_id` du schéma d'entrée |
| ancien contrat | `OrderCreate` est un payload simple avec `service_id`, `quantity`, `scheduled_pickup_at` | le vrai payload contient `partner_id`, `items[]`, flags logistiques, `idempotency_key` | P0 | corriger docs/tests/frontend |
| ancien contrat | `pricing/estimate` et `orders/estimate` sont interchangeables | ce sont deux contrats distincts | P1 | choisir quel endpoint le frontend doit utiliser |

## Divergences d'implémentation derrière des routes réelles

Ces routes existent, mais leur implémentation actuelle reste fragile ou incohérente.

| Fichier | Contradiction observée | Impact | Sévérité | Fix minimal |
|---|---|---|---|---|
| `apps/api/app/api/routes/payments.py` | `UserRole.PARTNER` est utilisé alors que ce rôle n'existe pas dans `UserRole` | `confirm-cash` peut casser ou mentir sur les permissions | P0 | remplacer par les rôles partenaires réels |
| `apps/api/app/api/routes/payments.py` | `list_payment_intents` référence `payment_repo.model`, absent du repository | route admin probablement cassée | P1 | requêter le modèle réel explicitement |
| `apps/api/app/api/routes/payments.py` | `PaymentProvider(provider.upper())` ne correspond probablement pas aux valeurs enum stockées | webhook potentiellement cassé | P1 | aligner la conversion de provider |
| `apps/api/app/api/routes/pricing.py` | `validate_order_items` prend `partner_id` et `items` sans schéma enveloppe clair | contrat HTTP fragile et mal documenté | P2 | introduire un schéma dédié |
| `apps/api/app/api/routes/pricing.py` | route sync branchée sur `get_db` alors que le système mélange sync/async ailleurs | risque de comportement non déterministe | P2 | réaligner les dépendances DB |

## Ordre d'exécution sûr

1. Considérer `API_ROUTES_REAL.md` comme vérité des endpoints exposés.
2. Considérer `API_CONTRACT_MVP.md` comme vérité du contrat MVP utilisable.
3. Réduire ensuite les tests aux seuls domaines `auth`, `orders`, `pricing`, `payments`.
4. Écrire un smoke test backend client réel avant de toucher l'UI.
5. Ne brancher le frontend que sur les contrats corrigés.

## Feu de passage

- GO pour continuer sur les tests MVP ciblés
- NO-GO pour brancher l'UI sans corriger les écarts P0 ci-dessus
