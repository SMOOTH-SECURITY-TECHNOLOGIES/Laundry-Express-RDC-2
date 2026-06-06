# Staging Handoff

Date: 2026-03-19

## Goal

Move from locally-proven MVP to a real staging validation run without inventing environment details.

Interpret failures with:

- [STAGING_FLOW_RESULT_INTERPRETATION.md](/workspace/STAGING_FLOW_RESULT_INTERPRETATION.md)
- [STAGING_RUN_REPORT_TEMPLATE.md](/workspace/STAGING_RUN_REPORT_TEMPLATE.md)

## Required Inputs

Use one of these sources of truth before any remote staging run:

- copy [.env.staging.local.example](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/.env.staging.local.example) to `.env.staging.local` and export it into the shell
- or fill [.env.staging.example](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/.env.staging.example) values in your real secret store / CI variables

Required for a real remote oracle:

- `STAGING_API_BASE_URL`
- `STAGING_DATABASE_URL`
- `STAGING_DATABASE_URL_SYNC`

Recommended:

- `STAGING_FRONTEND_URL`
- `STAGING_SMOKE_TEST_USER_EMAIL`
- `STAGING_SMOKE_TEST_USER_PASSWORD`
- `STAGING_ADMIN_EMAIL`
- `STAGING_ADMIN_PASSWORD`
- `STAGING_PARTNER_OWNER_EMAIL`
- `STAGING_PARTNER_OWNER_PASSWORD`
- `STAGING_DRIVER_EMAIL`
- `STAGING_DRIVER_PASSWORD`
- `STAGING_LOGISTICS_EMAIL`
- `STAGING_LOGISTICS_PASSWORD`
- `STAGING_PAYMENT_PROVIDER_MODE`

## Local Preflight

Choose the oracle first:

- if `STAGING_*` remote variables do not exist, the only valid oracle is the local simulation target
- if `STAGING_*` remote variables exist, use the remote staging oracle

Run:

```powershell
cmd /c npm run check:staging-prereqs
cmd /c npm run test:staging-flows
```

Or use the one-command remote runner:

```powershell
cmd /c npm run test:staging-run
```

That runner loads `.env.staging.local`, stops immediately if prereqs fail, and only then launches the remote flow harness.

If no remote staging exists yet, stop here and use the local staging simulation target instead:

```powershell
cmd /c npm run test:local-staging-check
cmd /c npm run test:local-staging-flows
```

Expected:

- `check:staging-prereqs` becomes `GO TO NEXT STAGING ACTION`
- `test:staging-flows` executes the 5 real flows against the remote target and returns `GO` or `NO-GO`
- `test:local-staging-flows` does the same against the local simulated target on `127.0.0.1`
- if `check:staging-prereqs` says required `STAGING_*` are missing, do not rerun the remote harness again until the target is configured

## Real Staging Actions

1. Run `alembic upgrade head` against the real staging database.
2. Verify schema compatibility after migration on staging.
3. Run `npm run test:staging-flows` against the remote target.
4. Replay the MVP browser path on staging:
   `register -> login -> order -> payment modal -> tracking`
5. Validate real staging provider mode, or explicitly keep staging on local-proven payment paths only.
6. Classify each `NO-GO` by:
   - contract
   - seed data
   - permissions
   - state transition
   - infrastructure

## Honest Rule

- If staging target variables are missing: `NO-GO`
- If migration or browser walkthrough is unproven on staging: `GO WITH RESTRICTIONS`
- If the automated 5-flow run and browser walkthrough are both recorded successfully: advance to the next promotion discussion
