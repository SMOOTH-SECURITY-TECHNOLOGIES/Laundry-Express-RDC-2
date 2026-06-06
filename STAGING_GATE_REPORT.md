# Staging Gate Report

Date: 2026-03-19
Scope: readiness gate for promoting the locally-proven MVP to a real staging environment

## Verdict

GO WITH RESTRICTIONS

## Evidence

- `cmd /c npm run test:mvp-gate` passes locally on the real API/Postgres stack.
- The following local critical flows are proven end to end:
  - seeded credentials and role access
  - commissions
  - disputes
  - refunds
  - logistics
  - marketplace backoffice
  - promo creation plus pricing/order consumption
  - loyalty settings plus loyalty redemption/accrual/history, admin adjustments, admin-triggered expiry, and admin overview reporting through orders, payments, ledger reads, and audited admin actions
  - referral settings plus referral-code registration, first-order referee discount, referrer reward issuance, admin overview/watchlist reporting, admin review state persistence, and high-risk enforcement that blocks new code usage plus downstream rewards
  - browser MVP path `register -> login -> order -> payment modal -> tracking`
- Orders contract, idempotency, atomicity, and payment guards were already validated locally in real DB-backed runs.

## Blocking Items

- No remote staging migration proof on inherited staging data exists yet.
- No remote staging browser walkthrough has been executed yet.
- No real payment-provider environment validation exists beyond local cash/payment-intent paths.
- No concrete remote staging target is configured in the current environment.
- Major admin surfaces from this proof cycle are no longer local-only, but several remain intentionally narrow in scope; see [ADMIN_SURFACE_TRUTH_MATRIX.md](/workspace/ADMIN_SURFACE_TRUTH_MATRIX.md).
- The admin activity page is now backend-backed and already records reads plus selected financial admin events, but audit-log producer coverage is still partial for strong operational audit claims.

## Non-Blocking Risks

- Local seeded credentials are a dev bootstrap, not a production identity policy.
- Browser proof currently covers the main MVP path, not every UI branch.
- Some provider/webhook paths remain less proven than the main cash/intention path.
- Several admin configuration modules are backend-real but still prove scoped contracts more than full operational engines; see [ADMIN_SURFACE_TRUTH_MATRIX.md](/workspace/ADMIN_SURFACE_TRUTH_MATRIX.md).

## Minimal Actions Before Staging

1. Run `alembic upgrade head` on the real staging database.
2. Verify post-migration schema health on staging: new columns, constraints, enum-backed behavior, and data compatibility.
3. Replay the MVP flow on staging: `register -> login -> order -> payment modal -> tracking`.
4. Replay one backoffice staging flow: commissions or logistics marketplace.
5. Replay the admin configuration gate on staging-equivalent data: `npm run test:admin-config-gate`.
6. Validate provider environment configuration or explicitly constrain staging to the local-proven payment paths only.

## Environment Preflight

- Preflight command: `npm run check:staging-prereqs`
- Runtime flow harness: `npm run test:staging-flows`
- Failure interpretation grid: [STAGING_FLOW_RESULT_INTERPRETATION.md](/workspace/STAGING_FLOW_RESULT_INTERPRETATION.md)
- Run report template: [STAGING_RUN_REPORT_TEMPLATE.md](/workspace/STAGING_RUN_REPORT_TEMPLATE.md)
- Example env template: `.env.staging.example`
- Required environment variables for an actual staging run:
- `STAGING_API_BASE_URL`
- `STAGING_DATABASE_URL`
- `STAGING_DATABASE_URL_SYNC`

## Promotion Rule

- Promote to staging only if the five actions above are completed and recorded.
- Do not call the system production-ready from this report alone.
