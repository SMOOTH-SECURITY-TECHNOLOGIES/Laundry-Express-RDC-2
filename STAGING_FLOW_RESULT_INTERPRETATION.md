# Staging Flow Result Interpretation

Date: 2026-03-19
Scope: how to interpret `npm run test:staging-flows` results without confusing primary failures and cascading failures

## Purpose

This document exists to stop vague staging debugging.

`test:staging-flows` is not a certification tool.
It is a first-pass runtime verdict tool for five critical flows:

- `auth`
- `order`
- `payment`
- `logistics`
- `dispute_refund`

The goal is not to guess.
The goal is to classify each `NO-GO` into the right family of root cause and choose the smallest safe fix.

## Interpretation Rule

For every failed flow, answer these questions in order:

1. Is this a primary failure or a cascade from an earlier flow?
2. Is the root cause:
   - contract
   - seed data
   - permissions
   - state transition
   - infrastructure
3. Which exact route, schema, and service layer own the failure?
4. What is the smallest safe correction?

Do not fix downstream cascades before the first primary blocker.

## Failure Families

### Contract

Definition:
- request shape, response shape, validation rules, field names, or required values are inconsistent

Typical signals:
- `400`
- `404`
- `405`
- `422`

Examples:
- register payload accepted locally but rejected on staging
- create order fails because `pickup_requested` or `currency` contract changed
- refund/dispute route shape differs from the expected API

Primary layers to inspect:
- FastAPI route
- Pydantic schema
- frontend/request-building script

Minimal fix:
- align the request/response contract at the smallest boundary

### Seed Data

Definition:
- the environment is reachable, but the minimum data needed to execute the flow is absent or incomplete

Typical signals:
- no catalog partner
- no partner service
- no partner owner login
- no driver account
- no logistics manager account
- no usable admin account

Examples:
- logistics fails because no driver can be resolved or created
- payment/logistics fails because partner owner credentials do not exist on staging
- order fails because `/catalog/partners` returns empty

Primary layers to inspect:
- staging seeds
- admin bootstrap scripts
- partner/service bootstrap data

Minimal fix:
- add the minimum reproducible seed, not a hand-made staging-only exception

### Permissions

Definition:
- the data exists and the contract is correct, but the authenticated actor is not allowed to perform the action

Typical signals:
- `401`
- `403`

Examples:
- partner owner cannot confirm cash
- logistics manager cannot assign a task
- driver can read or do something they should not

Primary layers to inspect:
- route dependency guards
- role mapping
- user/partner linkage

Minimal fix:
- align the real role/ownership guard, not the test expectation

### State Transition

Definition:
- the action is structurally valid, but the business state does not allow it

Typical signals:
- `409`
- business-rule `400`

Examples:
- confirm-cash rejected because intent is already confirmed
- refund rejected because order is unpaid
- task start rejected because task was never accepted

Primary layers to inspect:
- service-layer workflow
- persisted order/payment/task state
- idempotency and race guards

Minimal fix:
- fix the transition rule or the preceding state mutation, not the later symptom

### Infrastructure

Definition:
- the route may be correct, but the environment cannot support the flow

Typical signals:
- `5xx`
- timeouts
- DNS/network errors
- CORS or gateway failures

Examples:
- health is down
- API reachable but DB/Redis/worker dependencies are broken
- auth works but payment/logistics cascades fail because background dependencies are absent

Primary layers to inspect:
- deployment topology
- DB connectivity
- Redis / worker availability
- reverse proxy / TLS / CORS

Minimal fix:
- restore the missing runtime dependency before changing business code

## Flow-by-Flow Interpretation

### Auth

Scope:
- `health`
- `register`
- `login`
- `/auth/me`

Common primary causes:
- contract
- infrastructure

Useful interpretation examples:
- `AUTH NO-GO: /auth/register returned 422`
  - likely contract mismatch
- `AUTH NO-GO: /auth/login returned 401 after successful register`
  - likely auth persistence, password hashing, or DB consistency issue
- `AUTH NO-GO: /auth/me returned 401 after login`
  - likely token issuance/validation mismatch

If `auth` fails:
- treat all later flow failures as likely cascading until proven otherwise

### Order

Scope:
- create address
- catalog lookup
- pricing estimate
- create order

Common primary causes:
- contract
- seed data
- permissions

Useful interpretation examples:
- `ORDER NO-GO: catalog partners list is empty`
  - seed data issue
- `ORDER NO-GO: create_address returned 403`
  - permissions or auth propagation issue
- `ORDER NO-GO: create_order returned 422`
  - request contract drift

If `order` fails:
- `payment`, `logistics`, and `dispute_refund` may all be cascading

### Payment

Scope:
- payment intent
- confirm cash

Common primary causes:
- permissions
- state transition
- provider configuration

Useful interpretation examples:
- `PAYMENT NO-GO: create_payment_intent returned 409`
  - likely stale order/payment state or duplicate state transition
- `PAYMENT NO-GO: confirm_cash returned 403`
  - permissions failure on confirmer role
- `PAYMENT NO-GO: confirm_cash returned 409`
  - invalid intent state transition

If `payment` fails:
- `dispute_refund` may be cascading if the order never becomes paid

### Logistics

Scope:
- driver existence
- location update
- pickup task creation
- assignment
- accept/start/complete

Common primary causes:
- seed data
- permissions
- state transition

Useful interpretation examples:
- `LOGISTICS NO-GO: driver bootstrap failed`
  - seed issue
- `LOGISTICS NO-GO: assign_driver returned 403`
  - permissions issue on logistics/admin role
- `LOGISTICS NO-GO: start returned 409`
  - task lifecycle issue

### Dispute / Refund

Scope:
- create dispute
- refund request creation
- partner/admin access
- approve refund
- process refund

Common primary causes:
- state transition
- permissions
- contract

Useful interpretation examples:
- `DISPUTE_REFUND NO-GO: create_dispute returned 400`
  - contract or unpaid-order invariant
- `DISPUTE_REFUND NO-GO: approve_refund returned 403`
  - admin permission failure
- `DISPUTE_REFUND NO-GO: process_refund returned 409`
  - invalid refund state transition

## Primary vs Cascading Failures

Use this rule:

- If `auth` fails, everything later is provisional cascade.
- If `order` fails, `payment`, `logistics`, and `dispute_refund` are likely cascade.
- If `payment` fails, `dispute_refund` may be cascade.
- `logistics` is usually independent from `dispute_refund` after order/payment succeed.

Fix order:

1. first primary blocker
2. rerun
3. reclassify remaining failures

Do not batch-fix unrelated guesses across all flows at once.

## Minimal Triage Template

When a staging run fails, record each failure in this shape:

```text
FLOW:
VERDICT: GO / NO-GO
PRIMARY OR CASCADE:
ENDPOINT:
HTTP STATUS:
FAILED STEP:
MINIMAL PAYLOAD/INPUT:
ROOT CAUSE FAMILY:
LIKELY OWNER LAYER:
SMALLEST SAFE FIX:
```

## Decision Rule After A Run

### One flow fails

- classify it
- fix only that primary blocker
- rerun the whole staging harness

### Multiple flows fail

- separate primary from cascade
- fix only the earliest primary blocker first
- rerun

### All flows pass

- this is enough for an initial staging `GO`
- it is still not exhaustive certification

## Honest Statement

Use this wording in reports:

> The repository now includes an executable staging flow validation harness covering the five critical flows. Its results must be interpreted by failure family and by primary-versus-cascading status. A passing run supports an initial staging go/no-go decision, but it is not an exhaustive certification of the whole system.
