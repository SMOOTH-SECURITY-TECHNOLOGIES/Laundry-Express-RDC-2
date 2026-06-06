# Order Stability Validation Report

Date: 2026-03-18
Scope: local Docker-backed validation on the real Postgres/API stack

## Migration Staging

Status: validated locally on the running stack, not yet on remote staging.

- `alembic upgrade head` executed successfully in the API container.
- Alembic head is now `b2e4f6a9c1d3`.
- During validation, two migration issues were uncovered and fixed:
  - orders migration had to be made defensive because `orders.amount_paid` already existed in the real schema history.
  - payment tables were still on an older contract and required an alignment migration.

## Idempotence HTTP

Status: validated on the real local API.

- Case 1: order creation without `Idempotency-Key` returned `201`.
- Case 2: order creation with a unique `Idempotency-Key` returned `201`.
- Case 3: duplicate call with the same `Idempotency-Key` returned `200` on replay.
- DB verification confirmed exactly one persisted order for the duplicated key.
- Concurrent validation with 4 parallel HTTP requests using the same key produced one persisted order only.

## Atomicity Transactionnelle

Status: validated on the real local Postgres database.

- A forced failure was injected after partial item creation inside `OrderService.create_order()`.
- Result: no `orders` row persisted for the failing idempotency key.
- Result: no `order_items` rows persisted for the failing order.
- This validates rollback behavior beyond the unit-test level.

## Garde-fou Paiement

Status: validated on the real local Postgres database after payment schema alignment.

- A paid order was inserted with `payment_status = paid`.
- `PaymentService.create_payment_intent()` correctly rejected creation of a new intent.
- Validation exposed a real schema drift in `payment_intents`; this was corrected with migration `b2e4f6a9c1d3`.

## Risques Restants

- Remote staging has not been exercised yet; local Docker is not a substitute for staging data reality.
- The broader async/sync DB dependency split still exists outside the Orders slice.
- Payment module alignment was corrected enough for current service usage, but a wider end-to-end payment flow should still be exercised.
- Pydantic v1-style validators remain in the codebase and generate warnings; this is not a blocker for order stability but is still technical debt.
