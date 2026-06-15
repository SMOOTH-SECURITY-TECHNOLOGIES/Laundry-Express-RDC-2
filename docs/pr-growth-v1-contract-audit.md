# PR Checklist - Growth Engine V1

## Merge Gate

- [x] Growth Engine backend endpoints are implemented.
- [x] Growth Engine admin UI is wired to backend data.
- [x] Promotions and Growth Engine wording are separated.
- [x] Sprint Growth V1.1 E2E gate is implemented.
- [x] API contract mini-audit is complete.
- [x] Full production readiness gate passes with `TRUTH_RUN_E2E=1`.
- [ ] Human PR review completed.
- [ ] Do not merge before reviewer approval.

## API Contract Mini-Audit

Audited routes in `apps/api/app/api/routes/admin_campaigns.py`:

- `GET /admin/campaigns/growth/dashboard`
- `GET /admin/campaigns/growth/segments`
- `GET /admin/campaigns/growth/automations`
- `GET /admin/campaigns/growth/promo-fraud`
- `GET /admin/campaigns/growth/trending-offers`
- `GET /admin/campaigns/growth/roi`
- `POST /admin/campaigns/growth/promo-fraud/{promo_code}/review`
- `POST /admin/campaigns/growth/promo-fraud/{promo_code}/suspend`
- `POST /admin/campaigns/growth/automations/{automation_key}/prepare`

Findings:

- [x] All Growth routes require authenticated admin access through `_require_admin(current_user)`.
- [x] Growth routes use explicit response models from `apps/api/app/schemas/campaign_dashboard.py`.
- [x] `GrowthDashboardResponse` exposes stable frontend-ready fields: acquisition, activation, conversion, retention, referral, revenue, RFM, automations, promo fraud, trending offers, ROI, and source.
- [x] `RfmSegmentResponse` exposes aggregate segment data only: no `customer_id`, email, phone, name, or user-level PII.
- [x] `GrowthRoiResponse` exposes backend-computed promo, loyalty, referral, remarketing, reactivation, CAC, LTV, and ROI metrics.
- [x] Promo fraud actions write audit logs for review and suspend mutations.
- [x] Automation preparation writes an audit log and persists the workflow state.

## E2E Evidence

Validated locally against Docker API/Postgres:

- `python scripts/validate_growth_engine_truth.py`
  - Result: `3/3` Growth steps passed.
- `npm run check:production-readiness`
  - Result: static readiness `22/22`.
- `TRUTH_RUN_E2E=1 npm run check:production-readiness`
  - Result: `GO: 8/8 executed steps passed`.

## Commit Categories

Suggested PR review grouping:

- `feat(api)`: Growth dashboard endpoints, typed schemas, backend calculations, audit-backed actions.
- `feat(web)`: Growth Engine admin UI, sidebar routing, backend API mappers and hooks.
- `test(growth)`: Growth V1.1 truth validator and production readiness gate integration.
- `docs(growth)`: Sprint Growth V1.1 E2E contract and PR audit checklist.

## Remaining Work After This PR

- Add deeper E2E scenarios for 30/60/90 day reactivation cohorts.
- Add Marketing AI moderation/output validation before exposing AI campaign generation.
- Add partner campaign export/privacy E2E coverage before partner-facing UI expansion.
- Start admin/partner UI enhancements only after this PR is reviewed and accepted.
