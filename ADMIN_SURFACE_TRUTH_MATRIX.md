# Admin Surface Truth Matrix

Date: 2026-03-19
Scope: current truth status of admin-facing pages in the local Laundry Express environment

## Verdict

BACKEND-REAL FOR ALL MAJOR ADMIN SURFACES IN THIS PROOF CYCLE, WITH SCOPED RESTRICTIONS

The admin area is no longer one blurry surface.
The major pages audited in this cycle now have real backend contracts.
What remains are scope limitations on some of those contracts, not simple local-only fakery.

## Backend-Real Admin Surfaces

These pages now read from proven backend routes and should be treated as the current admin truth in local validation:

- `dashboard`
  - Source: `/admin/overview`
  - Proof: real backend metrics validated
- `orders`
  - Source: `/orders`
  - Proof: real customer, partner, totals, status
- `drivers`
  - Source: `/logistics/drivers`, `/logistics/tasks`
  - Proof: real driver and mission state
- `analytics`
  - Source: `/admin/overview`, `/orders`
  - Proof: real aggregates derived from backend orders
- `users`
  - Source: `/users`
  - Proof: real admin user list route
- `refunds`
  - Source: `/refunds/requests`
  - Proof: real read + real admin actions
- `support`
  - Source: `/support/tickets`
  - Proof: real read-only source
- `partners`
  - Source: `/catalog/partners`, `/pricing/partners/{partner_id}/summary`, `/marketplace/companies`
  - Proof: real laundry and logistics partner lists
- `services`
  - Source: `/catalog`
  - Proof: real service categories and service types
- `adminManagement`
  - Source: `/users`
  - Proof: real backend-backed admin listing
  - Restriction: create-admin and granular permission editing are still not proven as backend admin-control operations in this screen
- `activity`
  - Source: `/admin/activity-logs`
  - Proof: real backend-backed audit-log listing route
  - Current proven producers: audit-log reads, refund approval/processing, commission recompute/settlement
  - Restriction: backend coverage is now real but still partial, not yet a full operational audit trail
- `promotions`
  - Source: `/promotions`
  - Proof: real admin CRUD validated locally plus audit-log producers for create/update/delete, and promo consumption validated through pricing and order totals
  - Restriction: promo settings and core discount application are proven, but this is not yet a full campaign engine with attribution analytics or advanced per-customer enforcement
- `content`
  - Source: `/content/site`
  - Proof: real public read + admin update validated locally, with audit-log producer on content updates
  - Restriction: the proven scope is site hero, how-it-works, and FAQ content only, not a full CMS or publishing workflow
- `subscriptions`
  - Source: `/subscriptions/plans`
  - Proof: real public plan catalog + admin CRUD validated locally, with audit-log producers for create/update/delete
  - Restriction: this proves the plan catalog only, not real partner subscription assignment, billing execution, or invoice generation
- `tracking`
  - Source: `/tracking/settings`
  - Proof: real public read + admin update validated locally, with audit-log producer on tracking settings updates
  - Restriction: the proven scope is GTM container ID and Meta Pixel ID persistence only, not the broader server-side analytics pipeline
- `advertisements`
  - Source: `/advertisements`
  - Proof: real public list + admin CRUD validated locally, with audit-log producers for create/update/delete
  - Restriction: this proves the advertisement catalog that feeds current public pages, not a full campaign-management platform
- `loyalty`
  - Source: `/loyalty/settings`
  - Proof: real public read + admin update validated locally, with audit-log producer on loyalty settings updates; loyalty points redemption is proven through `/orders/estimate` and `/orders`, loyalty accrual is proven after paid orders through `/payments/intents/*/confirm-cash`, customer loyalty history is exposed through `/loyalty/me/history`, admin point adjustments are proven through `/loyalty/admin/adjustments`, expiry policy is proven through ledger-backed `expires_at` timestamps and `/loyalty/admin/run-expiration`, and admin reporting is exposed through `/loyalty/admin/overview` with top balances plus recent ledger activity
  - Restriction: this proves settings, core redemption/accrual behavior, a ledger/history path, audited admin adjustments, admin-triggered expiration, and a useful admin overview, not yet a full loyalty platform with automated scheduling or rich rewards reporting
- `referral`
  - Source: `/referral/settings`
  - Proof: real public read + admin update validated locally, with audit-log producer on referral settings updates; referral codes are generated and exposed on users, referred registration is proven through `/auth/register`, referee first-order discount is proven through `/orders/estimate` and `/orders`, referrer reward issuance is proven after first paid order through loyalty-ledger history, admin reporting is exposed through `/referral/admin/overview` with top referrers, recent conversion state, funnel counters, and a heuristic watchlist, admin review state is proven through `/referral/admin/reviews/{referrer_user_id}`, and `reviewed_high_risk` enforcement is proven to block new code usage plus downstream discount/bonus issuance
  - Restriction: this proves a minimal referral engine plus a useful admin overview, watchlist, manual review layer, and one concrete anti-abuse enforcement path, not yet a full referral platform with richer invite lifecycle or advanced attribution/reporting

## Local-Only Admin Surfaces

There are currently no major admin pages left in the intentionally local-only bucket from this proof cycle.
## Mixed or Not Yet Re-Audited

There are currently no major admin pages left in the unclassified bucket from this proof cycle.

## Operational Meaning

- A backend-real page is a valid local admin source of truth.
- A local-only page, if one reappears, is a valid local UX/config surface, not a proven platform control plane.
- A mixed page should not be used for staging claims until audited.

## Recommended Usage Rule

- Use backend-real pages for local proof, demos with operational claims, and staging preparation.
- If a page falls back to local-only behavior in the future, use it only for local product iteration or visual demos.
- Do not include local-only behavior in staging readiness claims.

## Next Minimal Actions

1. Enrich backend audit-log producers
2. Prove pricing-engine consumption of backend promo codes
3. Expand site content beyond hero/how-it-works/faq into a broader CMS contract if needed
4. Prove real partner subscription assignment and billing lifecycle
5. Expand tracking proof beyond GTM/Meta config into broader analytics pipeline if needed
6. Expand loyalty proof from the current ledger/history, adjustments, admin-triggered expiration, and overview into a full rewards platform with automated scheduling and richer reporting if needed
7. Expand referral proof from the current engine, overview, watchlist, manual review, and high-risk enforcement into richer attribution, stronger anti-abuse controls, and reporting if needed
8. Split future reports into:
   - backend-real admin proof
   - local-only admin UX
   - unknown / mixed admin surfaces
9. Re-run `npm run test:admin-config-gate` whenever admin configuration surfaces change
