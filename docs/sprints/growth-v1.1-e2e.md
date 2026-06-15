# Sprint Growth V1.1 - E2E Contracts

## Objective

Validate Growth Engine V1 with automated end-to-end checks before starting admin or partner UI work.

## Merge Gate

Do not merge the Growth Engine PR until the API contract mini-audit is complete.

Do not start admin/partner UI implementation until this sprint has executable E2E coverage for the backend growth flows.

## API Contract Mini-Audit

- [x] Confirm every `/admin/campaigns/growth/*` route is admin-only.
- [x] Confirm response field names are stable and frontend-ready.
- [x] Confirm Pydantic response types match API-first usage.
- [x] Confirm RFM segmentation exposes aggregate counts only, no customer PII.
- [x] Confirm promo fraud risk output is actionable and deterministic.
- [x] Confirm ROI analytics use backend truth, not localStorage or business mocks.
- [x] Confirm compatibility with the production readiness gate and Truth Dashboard.

## E2E Scope

- [ ] Promotion creation and usage remains green.
- [ ] Loyalty attribution remains green.
- [ ] Referral attribution remains green.
- [x] RFM segmentation returns aggregate backend segments without customer PII.
- [x] Abandoned cart automation can be prepared from the backend Growth rules.
- [ ] Reactivation automation identifies 30/60/90 day inactive customers.
- [ ] Marketing AI generation is validated through moderated output.
- [x] ROI analytics returns promo, loyalty, referral, remarketing, reactivation, CAC, LTV and ROI metrics.
- [x] Promo fraud scoring flags excess usage and high discount risk.
- [x] Growth actions are represented in audit logs where mutations occur.
- [ ] Partner campaign flows do not export or expose customer PII.

## Implemented Script

- `scripts/validate_growth_engine_truth.py`

This script validates the Growth dashboard contract, admin-only access, RFM privacy, ROI contract fields, promo fraud review/suspend actions, automation preparation, and mutation audit logs.

## Future Deep-Dive Scripts

- `scripts/validate_growth_segmentation_truth.py`
- `scripts/validate_growth_automation_truth.py`
- `scripts/validate_growth_ai_truth.py`

## Definition Of Done

- [x] `TRUTH_RUN_E2E=1 npm run check:production-readiness` includes Growth V1.1 checks.
- [x] Growth E2E checks run against Docker local API and Postgres.
- [x] No E2E check depends on business mock data.
- [x] No E2E check uses localStorage as source of truth.
- [ ] PR checklist is updated with Growth V1.1 results.
