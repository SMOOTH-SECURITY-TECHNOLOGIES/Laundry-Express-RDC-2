# Architect AI Playbook

This repository now includes a repo-local prompt kit for running DeepSeek Reasoner as an Architect AI instead of a generic coding assistant.

## Installed Assets

- Cline rules: [.clinerules](/workspace/.clinerules)
- Continue system prompt: [.continue/prompts/architect-ai.system.md](/workspace/.continue/prompts/architect-ai.system.md)
- Continue task prompts:
  - [.continue/prompts/architect-audit-repo.prompt.md](/workspace/.continue/prompts/architect-audit-repo.prompt.md)
  - [.continue/prompts/architect-audit-api-contract.prompt.md](/workspace/.continue/prompts/architect-audit-api-contract.prompt.md)
  - [.continue/prompts/architect-audit-tests.prompt.md](/workspace/.continue/prompts/architect-audit-tests.prompt.md)
  - [.continue/prompts/architect-audit-flows.prompt.md](/workspace/.continue/prompts/architect-audit-flows.prompt.md)
  - [.continue/prompts/architect-audit-backend.prompt.md](/workspace/.continue/prompts/architect-audit-backend.prompt.md)
  - [.continue/prompts/architect-audit-frontend-backend.prompt.md](/workspace/.continue/prompts/architect-audit-frontend-backend.prompt.md)
  - [.continue/prompts/architect-audit-infra.prompt.md](/workspace/.continue/prompts/architect-audit-infra.prompt.md)
  - [.continue/prompts/architect-staging-gate.prompt.md](/workspace/.continue/prompts/architect-staging-gate.prompt.md)

## Working Model

- DeepSeek Reasoner: audit, contradiction detection, flow analysis, remediation strategy
- Coding model: mechanical fixes, fixtures, patch application, localized refactors
- Human: business arbitration, priority, go/no-go decisions

## Operating Loop

1. Ask what is true.
2. Ask what diverges.
3. Ask for the smallest safe fix.
4. Apply the fix.
5. Re-audit the exact divergence.
6. Prove the flow, not just the file.

## Proof Gate

- Legacy role drift gate: `npm run test:role-drift`
- Seeded credential gate: `npm run test:seeded-credentials`
- Role access gate: `npm run test:role-access`
- Commissions flow gate: `npm run test:commissions-flow`
- Disputes flow gate: `npm run test:disputes-flow`
- Refunds flow gate: `npm run test:refunds-flow`
- Promotions flow gate: `npm run test:promotions-flow`
- Promo pricing consumption gate: `npm run test:promo-pricing-flow`
- Content flow gate: `npm run test:content-flow`
- Subscriptions flow gate: `npm run test:subscriptions-flow`
- Tracking flow gate: `npm run test:tracking-flow`
- Advertisements flow gate: `npm run test:advertisements-flow`
- Loyalty settings gate: `npm run test:loyalty-flow`
- Loyalty engine gate: `npm run test:loyalty-engine-flow`
- Loyalty admin-adjustment gate: `npm run test:loyalty-adjustment-flow`
- Loyalty expiry gate: `npm run test:loyalty-expiry-flow`
- Referral settings gate: `npm run test:referral-flow`
- Referral engine gate: `npm run test:referral-engine-flow`
- Referral review gate: `npm run test:referral-review-flow`
- Referral anti-abuse gate: `npm run test:referral-antifraud-flow`
- Loyalty/referral admin reporting gate: `npm run test:loyalty-referral-reporting-flow`
- Admin config aggregate gate: `npm run test:admin-config-gate`
  - Includes promo pricing consumption, not just promo CRUD
  - Includes loyalty expiry plus loyalty/referral admin reporting, referral manual review, and referral high-risk enforcement, not just settings and engine behavior
- Logistics flow gate: `npm run test:logistics-flow`
- Marketplace flow gate: `npm run test:marketplace-flow`
- Browser flow gate: `npm run test:browser-ui-flow`
- Aggregate MVP gate: `npm run test:mvp-gate`
- Staging prerequisite check: `npm run check:staging-prereqs`
- Staging runtime flow harness: `npm run test:staging-flows`
- Local staging simulation check: `npm run test:local-staging-check`
- Local staging simulation flows: `npm run test:local-staging-flows`
- Staging readiness report: `npm run report:staging-gate`
- Staging handoff note: [STAGING_HANDOFF.md](/workspace/STAGING_HANDOFF.md)
- Staging result interpretation grid: [STAGING_FLOW_RESULT_INTERPRETATION.md](/workspace/STAGING_FLOW_RESULT_INTERPRETATION.md)
- Staging run report template: [STAGING_RUN_REPORT_TEMPLATE.md](/workspace/STAGING_RUN_REPORT_TEMPLATE.md)
- Admin surface truth map: [ADMIN_SURFACE_TRUTH_MATRIX.md](/workspace/ADMIN_SURFACE_TRUTH_MATRIX.md)
- Admin local-only staging restriction: [ADMIN_LOCAL_ONLY_STAGING_NO_GO.md](/workspace/ADMIN_LOCAL_ONLY_STAGING_NO_GO.md)
- Current proven path: `register -> login -> order -> payment modal -> tracking`
- This gate now also fails on visible translation-key leaks and debug UI regressions along that path.

## Recommended Audit Order for Laundry Express

1. User and UserProfile contract
2. Payment flows and state transitions
3. Integration test trustworthiness
4. Frontend/backend contract drift
5. Staging go/no-go gate

## First Prompts to Run

### Mission 1

```text
Audit the User and UserProfile contract across models, schemas, routes, tests, and frontend usage.
Determine the single source of truth and list all violations.
```

### Mission 2

```text
Audit all payment-related flows:
payment intent creation,
cash confirmation,
refund,
dispute.

Map the state transitions and detect unsafe or missing validations.
```

### Mission 3

```text
Audit integration tests and build a canonical fixture strategy for:
user,
profile,
partner,
order,
payment,
dispute.
```

### Mission 4

```text
Compare frontend API usage with the real backend contract for:
auth,
profile,
orders,
payments.
List every mismatch and propose minimal fixes.
```

### Mission 5

```text
Produce a go/no-go staging gate based on:
contract consistency,
critical flows,
test trustworthiness,
local environment reliability.
```

## Non-Negotiable Rules

- Do not ask the model to "fix everything".
- Do not ask the model to "make tests pass" without first auditing truth.
- Do not treat markdown docs as authoritative.
- Do not let frontend types become a second contract authority.
- Do not accept a verdict without evidence and proof status.
