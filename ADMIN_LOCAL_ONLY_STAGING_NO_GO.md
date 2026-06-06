# Admin Local-Only Staging No-Go

Date: 2026-03-19
Scope: admin pages that must not be treated as staging-safe control planes

## Verdict

NO-GO

The admin surfaces listed below are still local-only.
They are useful for local product iteration and UI demos.
They must not be presented as real staging or production admin controls.

## Affected Admin Pages

There are currently no remaining major admin pages from this proof cycle that are still local-only.

## Why They Are No-Go

This document remains as an operational guardrail.
At this point, the previously flagged major admin pages have been moved out of the local-only bucket.
What remains important is not page-locality anymore, but scope restrictions on several backend-real surfaces.

## What Is Allowed

- Local UI demos
- Product iteration
- Visual QA
- Copy/layout review
- Local exploratory testing

## What Is Not Allowed

- Staging sign-off
- Operational claims
- Release readiness claims
- Treating changes as persisted backend configuration
- Using these pages as admin source of truth

## Required Replacement Before Staging Use

For any future admin page that falls back to local-only behavior, the minimum replacement remains:

1. a backend route contract
2. backend persistence
3. permission checks
4. a real API client path
5. one proof command or integration test

## Note About Activity

`activity` is no longer local-only.
It now has a real backend listing route and proven producers for:
- audit-log reads
- refund approval / processing
- commission recompute / settlement

However, audit producers are still incomplete, so it is not yet a full operational audit source.

## Note About Promotions

`promotions` is no longer local-only.
It now has a real backend admin CRUD route and proven audit events for:
- create promo_code
- update promo_code
- delete promo_code

However, promo-code persistence being real does not yet prove automatic pricing-engine consumption.

## Note About Content

`content` is no longer local-only.
It now has a real backend route and proven behavior for:
- public read of site content
- admin update of site content
- audit logging on site-content updates

However, the proven scope is still intentionally narrow:
- hero
- how-it-works
- FAQ

This is not yet a full CMS, media library, or multi-stage publishing workflow.

## Note About Subscriptions

`subscriptions` is no longer local-only.
It now has a real backend route and proven behavior for:
- public listing of plan catalog
- admin create/update/delete of plans
- audit logging on plan changes

However, the remaining non-proven pieces are still important:
- partner subscription assignment
- billing execution
- invoice lifecycle

## Note About Referral

`referral` is no longer local-only.
It now has a real backend route and proven behavior for:
- public read of referral settings
- admin update of referral settings
- audit logging on referral-settings updates
- referral-code based registration
- one-time referee discount on first order
- referrer reward issuance after first paid order
- referral reward visibility through loyalty ledger history

However, this proves a minimal referral engine, not a full referral platform with:
- anti-abuse controls
- richer invite lifecycle management
- advanced attribution analytics
- admin reporting and moderation workflows

## Note About Tracking

`tracking` is no longer local-only.
It now has a real backend route and proven behavior for:
- public read of tracking settings
- admin update of tracking settings
- audit logging on tracking-settings updates

However, this proves only configuration persistence for:
- GTM container ID
- Meta Pixel ID

It does not yet prove a full server-side analytics or conversions pipeline.

## Note About Advertisements

`advertisements` is no longer local-only.
It now has a real backend route and proven behavior for:
- public advertisement listing
- admin create/update/delete
- audit logging on ad changes

However, this proves the current advertisement catalog only, not a larger marketing campaign engine.

## Note About Loyalty

`loyalty` is no longer local-only.
It now has a real backend route and proven behavior for:
- public read of loyalty settings
- admin update of loyalty settings
- audit logging on loyalty-settings updates
- loyalty points redemption applied by pricing and order creation
- loyalty points accrual applied after paid orders
- customer loyalty history available via backend ledger entries
- admin loyalty point adjustments with audit trail

However, this proves the loyalty settings contract plus the core redemption/accrual engine, a minimal customer history path, and audited admin adjustments, not a full backend loyalty platform with expiry policy or advanced reporting.

## Operator Rule

Use [ADMIN_SURFACE_TRUTH_MATRIX.md](/workspace/ADMIN_SURFACE_TRUTH_MATRIX.md) as the classification source,
and use this document as the operational restriction source for any page that is still local-only or any backend-real surface whose proven scope remains intentionally narrow.
