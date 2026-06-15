# Pilot Baseline — Controlled Transactional Pilot

**Status:** `Ready for controlled pilot` (local E2E gate validated)

**Date:** 2026-06-11

**Not:** `Fully production ready` / `Enterprise ready`

---

## E2E gate results (local Docker)

| Corridor | Result |
|----------|--------|
| Customer corridor truth | **14/14** GO |
| Loyalty / Referral truth | **8/8** GO |
| Promotions truth | **6/6** GO |
| API smoke | **7/7** GO |
| Static production readiness | **21/21** GO |

Run command:

```powershell
$env:TRUTH_RUN_E2E="1"
npm run test:production-readiness-e2e
```

GitHub equivalent:

```text
workflow_dispatch → run_truth_e2e=true
```

---

## Product scope (GO)

```text
Commande → Paiement → Promo → Fidélité → Parrainage
→ Tracking → Support → Réclamation → Avis → Audit
```

## Explicitly NO GO

```text
Marketing Messaging (SMS / WhatsApp / Email / Campagnes)
Enterprise Governance (RBAC premium)
Admin Premium Centers (hidden in pilot mode)
```

---

## Pilot configuration

```text
VITE_USE_MOCK_API=false
VITE_APP_ENV=pilot
VITE_PAYMENT_MODE=sandbox
```

---

## Pre-tag checklist (mandatory)

The tag `pilot-baseline-2026-06-11` must **not** be created until GitHub Actions passes with:

```text
Production Readiness Gate → workflow_dispatch → run_truth_e2e=true
```

### Prerequisites before triggering GitHub

1. Push `.github/workflows/production-readiness.yml` and all truth scripts to the remote branch.
2. Ensure `.env` is **not** committed (CI generates it from `.env.example` + `SECRET_KEY`).

### Trigger (GitHub UI)

```text
Actions → Production Readiness Gate → Run workflow → run_truth_e2e=true
```

### Trigger (GitHub CLI)

```bash
gh workflow run production-readiness.yml -f run_truth_e2e=true
gh run watch
```

### Local validation (already passed)

```powershell
$env:TRUTH_RUN_E2E="1"
npm run test:production-readiness-e2e
```

---

## Suggested git tag (only after GitHub green)

```bash
git tag -a pilot-baseline-2026-06-11 -m "Controlled transactional pilot baseline — E2E corridors validated"
```

---

## Known debt (post-pilot)

- `constants.tsx` mock DB still tracked (isolated behind `VITE_USE_MOCK_API`)
- Repo safety scan warns on mock seed credentials
