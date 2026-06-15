# Sprint Growth V1.1 - E2E Contracts

## Objective

Validate Growth Engine V1 with automated end-to-end checks before starting admin or partner UI work.

## Merge Gate

Do not merge the Growth Engine PR until the API contract mini-audit is complete.

Do not start admin/partner UI implementation until this sprint has executable E2E coverage for the backend growth flows.

## API Contract Mini-Audit

- [ ] Confirm every `/admin/campaigns/growth/*` route is admin-only.
- [ ] Confirm response field names are stable and frontend-ready.
- [ ] Confirm Pydantic response types match API-first usage.
- [ ] Confirm RFM segmentation exposes aggregate counts only, no customer PII.
- [ ] Confirm promo fraud risk output is actionable and deterministic.
- [ ] Confirm ROI analytics use backend truth, not localStorage or business mocks.
- [ ] Confirm compatibility with the production readiness gate and Truth Dashboard.

## E2E Scope

- [ ] Promotion creation and usage remains green.
- [ ] Loyalty attribution remains green.
- [ ] Referral attribution remains green.
- [ ] RFM segmentation returns expected segments from real paid orders.
- [ ] Abandoned cart automation identifies unpaid orders.
- [ ] Reactivation automation identifies 30/60/90 day inactive customers.
- [ ] Marketing AI generation is validated through moderated output.
- [ ] ROI analytics returns promo, loyalty, referral, remarketing, reactivation, CAC, LTV and ROI metrics.
- [ ] Promo fraud scoring flags excess usage, inactive promo usage and high discount risk.
- [ ] Growth actions are represented in audit logs where mutations occur.
- [ ] Partner campaign flows do not export or expose customer PII.

## Suggested Scripts

- `scripts/validate_growth_dashboard_truth.py`
- `scripts/validate_growth_segmentation_truth.py`
- `scripts/validate_growth_automation_truth.py`
- `scripts/validate_growth_roi_truth.py`
- `scripts/validate_growth_promo_fraud_truth.py`
- `scripts/validate_growth_ai_truth.py`

## Definition Of Done

- [ ] `TRUTH_RUN_E2E=1 npm run check:production-readiness` includes Growth V1.1 checks.
- [ ] Growth E2E checks run against Docker local API and Postgres.
- [ ] No E2E check depends on business mock data.
- [ ] No E2E check uses localStorage as source of truth.
- [ ] PR checklist is updated with Growth V1.1 results.
