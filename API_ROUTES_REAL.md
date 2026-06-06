# API Routes Real

Date de génération: 2026-03-18
Source de vérité: extraction runtime depuis `apps/api/app/main.py` via `app.routes`
Règle: ce document décrit ce que le backend expose réellement aujourd'hui, pas ce que les tests, le frontend ou la doc supposent.

## Point de contrôle

- Si une route critique attendue n'apparaît pas ici, on s'arrête.
- Si le frontend ou les tests utilisent une route absente de cette liste, c'est une divergence à corriger avant de continuer.
- Les routes MVP à fermer en premier sont: `auth`, `users/me`, `pricing`, `orders`, `payments`.

## Routes MVP réelles

### Auth

| Méthode | Route | Handler |
|---|---|---|
| `POST` | `/api/v1/auth/register` | `register` |
| `POST` | `/api/v1/auth/login` | `login` |
| `POST` | `/api/v1/auth/refresh` | `refresh_tokens` |
| `POST` | `/api/v1/auth/password-reset/request` | `request_password_reset` |
| `POST` | `/api/v1/auth/password-reset/confirm` | `confirm_password_reset` |
| `POST` | `/api/v1/auth/logout` | `logout` |
| `POST` | `/api/v1/auth/change-password` | `change_password` |
| `GET` | `/api/v1/auth/me` | `get_current_user_info` |

### Users / Profile / Addresses

| Méthode | Route | Handler |
|---|---|---|
| `GET` | `/api/v1/users/me` | `get_current_user_info` |
| `PUT` | `/api/v1/users/me` | `update_current_user` |
| `PUT` | `/api/v1/users/me/profile` | `update_current_user_profile` |
| `GET` | `/api/v1/users/me/addresses` | `get_current_user_addresses` |
| `POST` | `/api/v1/users/me/addresses` | `create_address` |
| `GET` | `/api/v1/users/me/addresses/{address_id}` | `get_address` |
| `PUT` | `/api/v1/users/me/addresses/{address_id}` | `update_address` |
| `DELETE` | `/api/v1/users/me/addresses/{address_id}` | `delete_address` |
| `POST` | `/api/v1/users/me/addresses/{address_id}/set-default` | `set_default_address` |
| `GET` | `/api/v1/users/{user_id}` | `get_user_by_id` |
| `PUT` | `/api/v1/users/{user_id}` | `update_user_by_id` |

### Pricing

| Méthode | Route | Handler |
|---|---|---|
| `POST` | `/api/v1/pricing/estimate` | `estimate_order_price` |
| `POST` | `/api/v1/pricing/calculate` | `calculate_order_price` |
| `GET` | `/api/v1/pricing/partners/{partner_id}/summary` | `get_pricing_summary` |
| `POST` | `/api/v1/pricing/validate` | `validate_order_items` |

### Orders

| Méthode | Route | Handler |
|---|---|---|
| `POST` | `/api/v1/orders` | `create_order` |
| `GET` | `/api/v1/orders` | `list_orders` |
| `GET` | `/api/v1/orders/{order_id}` | `get_order` |
| `POST` | `/api/v1/orders/estimate` | `estimate_order_price` |
| `POST` | `/api/v1/orders/{order_id}/cancel` | `cancel_order` |
| `POST` | `/api/v1/orders/{order_id}/status` | `update_order_status` |
| `GET` | `/api/v1/orders/{order_id}/statistics` | `get_order_statistics` |

### Payments

| Méthode | Route | Handler |
|---|---|---|
| `POST` | `/api/v1/payments/intents` | `create_payment_intent` |
| `POST` | `/api/v1/payments/intents/{intent_id}/initiate` | `initiate_payment` |
| `POST` | `/api/v1/payments/intents/{intent_id}/confirm-cash` | `confirm_cash_payment` |
| `GET` | `/api/v1/payments/intents/{intent_id}` | `get_payment_intent` |
| `GET` | `/api/v1/payments/orders/{order_id}/summary` | `get_order_payment_summary` |
| `POST` | `/api/v1/payments/webhooks/{provider}` | `handle_payment_webhook` |
| `GET` | `/api/v1/payments/intents` | `list_payment_intents` |

## Routes réelles hors MVP immédiat

### Catalog

- `GET /api/v1/catalog`
- `GET /api/v1/catalog/categories`
- `GET /api/v1/catalog/categories/{category_id}`
- `GET /api/v1/catalog/service-types`
- `GET /api/v1/catalog/service-types/{type_id}`
- `GET /api/v1/catalog/partners/{partner_id}/services`
- `GET /api/v1/catalog/partners/{partner_id}/services/{service_id}`
- `POST /api/v1/catalog/partners/{partner_id}/services`
- `PATCH /api/v1/catalog/partners/{partner_id}/services/{service_id}`
- `GET /api/v1/catalog/partners/{partner_id}/pricing-rules`
- `POST /api/v1/catalog/partners/{partner_id}/pricing-rules`
- `PATCH /api/v1/catalog/partners/{partner_id}/pricing-rules/{rule_id}`
- `POST /api/v1/catalog/categories`
- `PATCH /api/v1/catalog/categories/{category_id}`
- `POST /api/v1/catalog/service-types`
- `PATCH /api/v1/catalog/service-types/{type_id}`

### Logistics

- `GET /api/v1/logistics/drivers`
- `GET /api/v1/logistics/drivers/available`
- `GET /api/v1/logistics/drivers/{driver_id}`
- `POST /api/v1/logistics/drivers`
- `PATCH /api/v1/logistics/drivers/{driver_id}`
- `POST /api/v1/logistics/drivers/{driver_id}/location`
- `GET /api/v1/logistics/tasks`
- `GET /api/v1/logistics/tasks/{task_id}`
- `POST /api/v1/logistics/tasks/pickup`
- `POST /api/v1/logistics/tasks/delivery`
- `POST /api/v1/logistics/tasks/{task_id}/assign`
- `POST /api/v1/logistics/tasks/{task_id}/auto-assign`
- `POST /api/v1/logistics/tasks/{task_id}/accept`
- `POST /api/v1/logistics/tasks/{task_id}/start`
- `POST /api/v1/logistics/tasks/{task_id}/complete`
- `POST /api/v1/logistics/tasks/{task_id}/fail`
- `POST /api/v1/logistics/tasks/{task_id}/cancel`

### Marketplace / Dispatch / Refunds / Disputes / Commissions

- `GET /api/v1/marketplace/companies`
- `GET /api/v1/marketplace/companies/{company_id}`
- `POST /api/v1/marketplace/companies`
- `PATCH /api/v1/marketplace/companies/{company_id}`
- `GET /api/v1/marketplace/companies/{company_id}/zones`
- `POST /api/v1/marketplace/companies/{company_id}/zones`
- `GET /api/v1/marketplace/companies/{company_id}/drivers`
- `POST /api/v1/marketplace/companies/{company_id}/drivers`
- `GET /api/v1/marketplace/tasks`
- `GET /api/v1/marketplace/tasks/{task_id}`
- `POST /api/v1/marketplace/tasks/{task_id}/claim`
- `GET /api/v1/marketplace/tasks/{task_id}/claimed`
- `POST /api/v1/marketplace/tasks/{task_id}/dispatch`
- `POST /api/v1/marketplace/tasks/{task_id}/assign-internal`
- `POST /api/v1/marketplace/tasks/{task_id}/assign-company`
- `POST /api/v1/marketplace/tasks/{task_id}/expire`
- `POST /api/v1/marketplace/tasks/{task_id}/fallback`
- `GET /api/v1/dispatch-settings`
- `GET /api/v1/dispatch-settings/{setting_id}`
- `POST /api/v1/dispatch-settings`
- `PATCH /api/v1/dispatch-settings/{setting_id}`
- `DELETE /api/v1/dispatch-settings/{setting_id}`
- `GET /api/v1/dispatch-settings/resolve-strategy`
- `POST /api/v1/refunds/requests`
- `POST /api/v1/refunds/requests/{request_id}/approve`
- `POST /api/v1/refunds/requests/{request_id}/reject`
- `POST /api/v1/refunds/requests/{request_id}/process`
- `GET /api/v1/refunds/requests/{request_id}`
- `GET /api/v1/refunds/orders/{order_id}/requests`
- `GET /api/v1/refunds/summary`
- `GET /api/v1/refunds/requests`
- `POST /api/v1/disputes`
- `POST /api/v1/disputes/{dispute_id}/resolve`
- `POST /api/v1/disputes/{dispute_id}/reject`
- `GET /api/v1/disputes/{dispute_id}`
- `GET /api/v1/disputes/orders/{order_id}`
- `GET /api/v1/disputes/summary`
- `GET /api/v1/disputes`
- `GET /api/v1/disputes/open`
- `POST /api/v1/commissions/recompute/{order_id}`
- `POST /api/v1/commissions/{commission_id}/settle`
- `GET /api/v1/commissions/{commission_id}`
- `GET /api/v1/commissions/orders/{order_id}`
- `GET /api/v1/commissions/partners/{partner_id}/summary`
- `GET /api/v1/commissions/partners/{partner_id}/overview`
- `GET /api/v1/commissions`
- `GET /api/v1/commissions/pending`
- `GET /api/v1/commissions/computed`

## Verdict

- Les routes Orders réelles sont `/api/v1/orders` et non `/api/v1/orders/orders`.
- Le backend expose bien les routes MVP nécessaires pour fermer un premier parcours utilisateur.
- La simple existence des routes ne prouve pas encore leur contrat exact ni leur bon fonctionnement HTTP: le contrôle suivant est `API_CONTRACT_MVP.md` puis `API_DIFF.md`.
