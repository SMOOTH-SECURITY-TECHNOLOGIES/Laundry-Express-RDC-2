# API Contract MVP

Date de figement: 2026-03-18
Portée: contrat minimum à respecter pour fermer le premier vrai parcours utilisateur.
Source de vérité prioritaire: modèles Pydantic, handlers FastAPI, extraction runtime des routes.

## Verdict

- Le backend expose un socle MVP suffisant pour `register -> login -> me -> pricing -> create order -> payment intent -> confirm cash`.
- Le contrat réel n'est pas celui que les anciens documents décrivaient.
- Toute intégration UI ou test doit maintenant s'aligner sur ce document et non sur les anciennes hypothèses.

## Contrat MVP à considérer comme vrai

### 1. Auth

#### `POST /api/v1/auth/register`

Payload réel:

```json
{
  "email": "customer@example.com",
  "phone": "+243900000000",
  "name": "Jean Client",
  "password": "EXAMPLE_SECRET_FROM_ENV",
  "role": "customer"
}
```

Réponse réelle: `UserResponse`

```json
{
  "id": "uuid",
  "email": "customer@example.com",
  "phone": "+243900000000",
  "name": "Jean Client",
  "role": "customer",
  "status": "active",
  "is_email_verified": false,
  "is_phone_verified": false,
  "is_2fa_enabled": false,
  "last_login_at": null,
  "email_verified_at": null,
  "phone_verified_at": null,
  "created_at": "2026-03-18T10:00:00Z",
  "updated_at": "2026-03-18T10:00:00Z"
}
```

Notes:
- le rôle public est forcé à `customer`
- il n'existe pas de champ `is_active` dans `UserResponse`

#### `POST /api/v1/auth/login`

Payload réel:

```json
{
  "email": "customer@example.com",
  "password": "EXAMPLE_SECRET_FROM_ENV"
}
```

Réponse réelle: `TokenResponse`

```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Notes:
- la réponse ne contient pas `user`

#### `GET /api/v1/auth/me`

Réponse réelle: `UserWithProfileResponse`

```json
{
  "user": {
    "id": "uuid",
    "email": "customer@example.com",
    "phone": "+243900000000",
    "name": "Jean Client",
    "role": "customer",
    "status": "active",
    "is_email_verified": false,
    "is_phone_verified": false,
    "is_2fa_enabled": false,
    "last_login_at": null,
    "email_verified_at": null,
    "phone_verified_at": null,
    "created_at": "2026-03-18T10:00:00Z",
    "updated_at": "2026-03-18T10:00:00Z"
  },
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "first_name": "Jean",
    "last_name": "Client",
    "preferred_language": "fr",
    "theme_preference": "light",
    "avatar_url": null,
    "date_of_birth": null,
    "gender": null,
    "created_at": "2026-03-18T10:00:00Z",
    "updated_at": "2026-03-18T10:00:00Z"
  },
  "addresses": []
}
```

Notes:
- `/auth/me` et `/users/me` renvoient tous deux un objet combiné, pas un `User` plat

### 2. User / Profile / Addresses

#### Vérité de domaine

`User` porte:
- `email`
- `phone`
- `name`
- `role`
- `status`
- flags de vérification

`UserProfile` porte:
- `first_name`
- `last_name`
- préférences et métadonnées

Règle:
- le display name principal actuel est `User.name`
- les détails personnels complémentaires sont dans `UserProfile`

#### `PUT /api/v1/users/me`

Payload réel: `UserUpdate`

```json
{
  "name": "Jean Client",
  "phone": "+243900000001"
}
```

Réponse réelle: `UserResponse`

#### `PUT /api/v1/users/me/profile`

Payload réel: `UserProfileUpdate`

```json
{
  "first_name": "Jean",
  "last_name": "Client",
  "preferred_language": "fr",
  "theme_preference": "light"
}
```

Réponse réelle:
- `UserWithProfileResponse`
- pas un simple `UserProfileResponse`

#### `POST /api/v1/users/me/addresses`

Payload actuellement attendu par le schéma: `CustomerAddressCreate`

```json
{
  "user_id": "uuid",
  "label": "Maison",
  "contact_name": "Jean Client",
  "contact_phone": "+243900000000",
  "address_line_1": "12 Avenue ...",
  "address_line_2": null,
  "city": "Kinshasa",
  "commune": "Gombe",
  "zone": null,
  "reference_point": null,
  "latitude": null,
  "longitude": null,
  "instructions": null,
  "is_default": true
}
```

Réponse réelle: `CustomerAddressResponse`

Important:
- la route est bien `/users/me/addresses`
- mais le schéma demande encore `user_id`, ce qui contredit le fait que l'utilisateur courant est déjà connu côté serveur

### 3. Pricing

#### `POST /api/v1/pricing/estimate`

Payload réel: `PricingEstimateRequest`

```json
{
  "partner_id": "uuid",
  "items": [
    {
      "service_id": "uuid",
      "quantity": 2,
      "item_name": "Chemise",
      "notes": null
    }
  ],
  "express": false,
  "pickup_requested": true,
  "delivery_requested": true,
  "promo_code": null
}
```

Réponse réelle: `PricingEstimateResponse`

```json
{
  "subtotal": 1000.00,
  "surcharge_total": 0.00,
  "discount_total": 0.00,
  "fee_total": 0.00,
  "total": 1000.00,
  "currency": "CDF",
  "items": [],
  "adjustments": [],
  "partner_id": "uuid",
  "express_applied": false,
  "pickup_fee_applied": false,
  "delivery_fee_applied": false,
  "minimum_order_fee_applied": false,
  "explanation": null
}
```

Important:
- ce contrat est différent de `/api/v1/orders/estimate`
- `pricing/estimate` n'est pas un alias de `orders/estimate`

### 4. Orders

#### `POST /api/v1/orders`

Payload réel: `OrderCreate`

```json
{
  "partner_id": "uuid",
  "pickup_address_id": "uuid",
  "delivery_address_id": "uuid",
  "items": [
    {
      "service_id": "uuid",
      "item_name": "Chemise",
      "quantity": 2,
      "unit_price": 500.00,
      "notes": null,
      "detected_by_ai": false
    }
  ],
  "currency": "CDF",
  "special_instructions": "Manipuler avec soin",
  "pickup_date": null,
  "pickup_time_slot": null,
  "delivery_date": null,
  "delivery_time_slot": null,
  "express": false,
  "pickup_requested": true,
  "delivery_requested": true,
  "idempotency_key": "customer-req-001"
}
```

Réponse réelle: `OrderResponse`

Champs structurants de la réponse:
- `id`
- `order_number`
- `customer_id`
- `partner_id`
- `idempotency_key`
- `status`
- `payment_status`
- `subtotal_amount`
- `discount_amount`
- `pickup_fee`
- `delivery_fee`
- `total_amount`
- `amount_paid`
- `refunded_amount`
- `calculation_breakdown`
- `express`
- `pickup_requested`
- `delivery_requested`
- `items`

Important:
- la route réelle est `/api/v1/orders`
- le header `Idempotency-Key` est supporté côté route
- le champ `idempotency_key` est aussi présent dans le schéma

#### `POST /api/v1/orders/estimate`

Payload réel: `OrderEstimateRequest`

```json
{
  "partner_id": "uuid",
  "items": [
    {
      "service_id": "uuid",
      "item_name": "Chemise",
      "quantity": 2,
      "unit_price": 500.00,
      "notes": null,
      "detected_by_ai": false
    }
  ],
  "currency": "CDF",
  "express": false,
  "pickup_requested": true,
  "delivery_requested": true
}
```

Réponse réelle: `OrderEstimateResponse`

```json
{
  "subtotal_amount": 1000.00,
  "discount_amount": 0.00,
  "pickup_fee": 0.00,
  "delivery_fee": 0.00,
  "total_amount": 1000.00,
  "currency": "CDF",
  "calculation_breakdown": {}
}
```

#### `GET /api/v1/orders`

Réponse réelle:
- `OrderListResponse`
- structure enveloppée: `orders`, `total`, `page`, `page_size`
- pas une simple liste JSON d'orders

### 5. Payments

#### `POST /api/v1/payments/intents`

Payload réel: `PaymentIntentCreate`

```json
{
  "order_id": "uuid",
  "payment_method": "cash",
  "amount_expected": 1000.0,
  "currency": "CDF",
  "provider_name": null,
  "expires_at": null,
  "payment_metadata": null
}
```

Réponse réelle: `PaymentIntentResponse`

```json
{
  "id": "uuid",
  "order_id": "uuid",
  "customer_id": "uuid",
  "payment_method": "cash",
  "currency": "CDF",
  "amount_expected": 1000.0,
  "amount_paid": 0.0,
  "status": "pending",
  "provider_name": null,
  "provider_reference": null,
  "expires_at": null,
  "paid_at": null,
  "created_at": "2026-03-18T10:00:00Z",
  "updated_at": "2026-03-18T10:00:00Z",
  "payment_metadata": null
}
```

#### `POST /api/v1/payments/intents/{intent_id}/confirm-cash`

Payload réel: `CashPaymentConfirmRequest`

```json
{
  "confirmed_by_user_id": "uuid",
  "amount_paid": 1000.0,
  "notes": "Paiement reçu en cash"
}
```

Réponse réelle: `PaymentIntentResponse`

#### `GET /api/v1/payments/orders/{order_id}/summary`

Réponse réelle: `OrderPaymentSummary`

```json
{
  "order_id": "uuid",
  "total_amount": 1000.0,
  "amount_paid": 0.0,
  "amount_due": 1000.0,
  "payment_status": "pending",
  "payment_intents": [],
  "transactions": []
}
```

## Codes et conventions utiles

- `POST /auth/register` retourne `201`
- `POST /users/me/addresses` retourne `201`
- les autres `POST` MVP retournent en pratique `200` sauf indication contraire
- `GET /orders` retourne une enveloppe paginée
- le backend mélange encore routes async et services sync sur certaines zones, ce qui n'invalide pas les routes exposées mais reste un risque d'intégration

## Blocages connus à traiter avant la suite

1. `CustomerAddressCreate` exige encore `user_id` sur une route `/users/me/...`
2. `pricing/estimate` et `orders/estimate` ont deux contrats différents qu'il faut assumer explicitement côté frontend et tests
3. `login` ne retourne pas `user`
4. `/auth/me` ne retourne pas un `User` plat
5. `GET /orders` ne retourne pas un tableau nu

## Règle de contrôle

Tout test, script smoke ou code frontend qui ne respecte pas ce contrat doit être considéré faux jusqu'à preuve contraire.
