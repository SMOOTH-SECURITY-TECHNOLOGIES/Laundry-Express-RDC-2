# MVP Flow Go / No-Go

Date: 2026-03-18
Scope: `register -> login -> order -> payment modal -> tracking`

## Verdict

GO WITH RESTRICTIONS

## What Is Proven

- No legacy role drift remains for unsupported enum values such as `UserRole.PARTNER` or `UserRole.COMPANY`.
- Seeded credentials are valid for the supported local roles:
  - `super_admin`
  - `customer`
  - `partner_owner`
  - `partner_staff`
  - `driver`
  - `logistics_manager`
- The seeded inactive customer is rejected by authentication as expected.
- A minimal authorization matrix is locally proven:
  - `super_admin` can read a user on an admin route
  - `customer` is rejected on that admin route
  - `customer` can create an order and payment intent
  - `customer` is rejected on cash confirmation
  - `partner_owner` can confirm a cash payment
- A local commissions backoffice flow is now proven through:
  - admin commission computation on a paid order
  - partner-owner visibility on order commission and partner summary
  - admin partner overview visibility
  - admin computed-list visibility
  - admin settlement
  - settled commission visibility for partner-owner
- A local disputes flow is now proven through:
  - paid order creation
  - customer dispute creation
  - automatic refund request creation
  - partner-owner visibility
  - admin summary visibility
  - forbidden access for an unrelated driver
- A local refunds flow is now proven through:
  - customer refund request creation
  - forbidden creation for an unrelated driver
  - admin approval
  - admin processing
  - customer visibility on the request
  - admin refund summary visibility
- A local logistics dispatch flow is now proven through:
  - partner-owner pickup-task creation
  - admin driver assignment
  - driver location update
  - driver accept, start, and complete transitions
  - driver task-list visibility
- A local marketplace backoffice flow is now proven through:
  - admin company creation
  - admin service-zone and company-driver setup
  - admin marketplace dispatch opening
  - marketplace-operator task listing and claim
  - claimed-task visibility
  - admin company-driver assignment
  - assigned task visibility for the driver
- Backend order creation is stabilized on the critical path.
- Order creation, pricing, payment intent, and cash confirmation guards have been validated locally.
- Real browser-driven UI flow passes end to end through:
  - `register`
  - `login`
  - `order`
  - `payment modal`
  - `tracking`
- The browser gate also fails on:
  - visible translation-key leaks
  - visible debug UI regressions

## Proof Commands

- Aggregate local MVP gate:
  - `cmd /c npm run test:mvp-gate`
- Legacy role drift gate:
  - `python scripts/detect_legacy_role_drift.py`
  - `cmd /c npm run test:role-drift`
- Seeded credential proof:
  - `python scripts/verify_seeded_credentials.py`
  - `cmd /c npm run test:seeded-credentials`
- Role access proof:
  - `python scripts/verify_role_access_matrix.py`
  - `cmd /c npm run test:role-access`
- Disputes flow proof:
  - `python scripts/verify_disputes_flow.py`
  - `cmd /c npm run test:disputes-flow`
- Commissions flow proof:
  - `python scripts/verify_commissions_flow.py`
  - `cmd /c npm run test:commissions-flow`
- Refunds flow proof:
  - `python scripts/verify_refunds_flow.py`
  - `cmd /c npm run test:refunds-flow`
- Logistics flow proof:
  - `python scripts/verify_logistics_flow.py`
  - `cmd /c npm run test:logistics-flow`
- Marketplace flow proof:
  - `python scripts/verify_marketplace_flow.py`
  - `cmd /c npm run test:marketplace-flow`
- Unit and targeted integration proof:
  - `pytest tests/unit/test_order_service.py tests/unit/test_payment_service.py tests/unit/test_pricing_service.py -q`
  - `pytest tests/integration/test_orders_stability_real.py -q`
- API flow proof:
  - `python scripts/api_smoke_test.py`
  - `node scripts/validate-e2e.js`
- Browser proof:
  - `cmd /c npm run test:browser-ui-flow`

## Restrictions

- This is still local proof, not staging proof.
- No validation has been done yet on a real remote staging dataset with inherited production-like data.
- The browser gate proves one MVP path, not the whole application.
- Seeded credentials are a local bootstrap/dev convenience, not a production identity policy.
- Analytics server-side tracking is intentionally disabled unless `VITE_SERVER_TRACKING_URL` is configured.

## Remaining No-Go Areas

- Staging migration proof with real inherited data
- Concurrency proof beyond the current minimal idempotency checks
- Full payment-provider proof beyond payment intent creation and cash-confirmation path

## Operational Recommendation

- Accept local MVP flow as stable enough for controlled staging.
- Do not claim production readiness yet.
- Next gate should be:
  1. staging migration
  2. staging browser walkthrough on the same MVP path
  3. payment-provider environment validation
