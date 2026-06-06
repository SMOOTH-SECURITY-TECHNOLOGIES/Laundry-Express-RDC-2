# Staging Run Report Template

Date: YYYY-MM-DD
Run time: HH:MM TZ
Environment: staging / staging-like
Operator: NAME
Branch: BRANCH
Commit: SHA
Harness version: `npm run test:staging-flows`

## Run Verdict

Overall verdict:
- `GO`
- `NO-GO`

Promotion verdict:
- `READY FOR NEXT STAGING STEP`
- `GO WITH RESTRICTIONS`
- `NO-GO`

One-line summary:

> Example: `NO-GO because the first primary blocker is an order contract failure on POST /orders after auth succeeds.`

## Pre-Check

### Staging Prereqs

- `npm run check:staging-prereqs`: `PASS / FAIL`
- `STAGING_API_BASE_URL`: `present / missing`
- `STAGING_DATABASE_URL`: `present / missing`
- `STAGING_DATABASE_URL_SYNC`: `present / missing`

### Declared Runtime Dependencies

- API deployed: `yes / no / unknown`
- DB reachable: `yes / no / unknown`
- Redis reachable: `yes / no / unknown`
- Worker running: `yes / no / unknown`
- Provider mode: `cash_only / sandbox / live-like / unknown`
- Minimum seeded roles present:
  - admin: `yes / no / unknown`
  - partner owner: `yes / no / unknown`
  - driver: `yes / no / unknown`
  - logistics manager: `yes / no / unknown`

## Automated Harness Output

Command:

```powershell
cmd /c npm run test:staging-flows
```

Raw result:

```text
PASTE RAW OUTPUT HERE
```

## Flow Results

### Auth

- Verdict: `GO / NO-GO`
- First failed step:
- Endpoint / action:
- HTTP status:
- Minimal input:
- Root cause family:
  - `contract`
  - `seed data`
  - `permissions`
  - `state transition`
  - `infrastructure`
- Primary or cascading:
  - `primary`
  - `cascading`
- Likely owner layer:
- Smallest safe fix:

### Order

- Verdict: `GO / NO-GO`
- First failed step:
- Endpoint / action:
- HTTP status:
- Minimal input:
- Root cause family:
  - `contract`
  - `seed data`
  - `permissions`
  - `state transition`
  - `infrastructure`
- Primary or cascading:
  - `primary`
  - `cascading`
- Likely owner layer:
- Smallest safe fix:

### Payment

- Verdict: `GO / NO-GO`
- First failed step:
- Endpoint / action:
- HTTP status:
- Minimal input:
- Root cause family:
  - `contract`
  - `seed data`
  - `permissions`
  - `state transition`
  - `infrastructure`
- Primary or cascading:
  - `primary`
  - `cascading`
- Likely owner layer:
- Smallest safe fix:

### Logistics

- Verdict: `GO / NO-GO`
- First failed step:
- Endpoint / action:
- HTTP status:
- Minimal input:
- Root cause family:
  - `contract`
  - `seed data`
  - `permissions`
  - `state transition`
  - `infrastructure`
- Primary or cascading:
  - `primary`
  - `cascading`
- Likely owner layer:
- Smallest safe fix:

### Dispute / Refund

- Verdict: `GO / NO-GO`
- First failed step:
- Endpoint / action:
- HTTP status:
- Minimal input:
- Root cause family:
  - `contract`
  - `seed data`
  - `permissions`
  - `state transition`
  - `infrastructure`
- Primary or cascading:
  - `primary`
  - `cascading`
- Likely owner layer:
- Smallest safe fix:

## Triage Decision

First retained bottleneck:

- Flow:
- Step:
- Why this is primary:
- Why later failures are considered cascading:

Chosen minimal correction:

- Owner:
- File(s) or environment artifact(s):
- Correction scope:
- What must not be changed yet:

## Re-Run Plan

Next action:

1. apply the smallest safe fix for the first primary blocker
2. rerun `npm run test:staging-flows`
3. reclassify remaining failures

Re-run status:
- `not started`
- `in progress`
- `completed`

Re-run result:
- `GO`
- `NO-GO`
- `not run yet`

## Notes

Use this report to decide the next correction.
Do not turn it into a broad improvement wishlist.

The only question this report should answer is:

> What prevented the system from passing, and what is the smallest safe correction to apply now?
