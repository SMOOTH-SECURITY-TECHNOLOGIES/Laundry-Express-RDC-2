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

### Mobile Logistics V1 technical evidence

**Date:** 2026-06-18 20:09 Africa/Kinshasa

**Validation commit before evidence update:** `73042ca743e70363e08f3c35f552aec29f416c1b`

**Environment:** local Docker Compose

```text
API: http://localhost:18000/api/v1
Web: http://localhost:3003
DB: postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express
Containers: laundry_api, laundry_db, laundry_redis, laundry_web
```

Commands:

```bash
npm run build
npm run test -- components/driver/__tests__/DriverMobileDashboard.mobile.test.tsx components/dispatcher/__tests__/DispatcherMobileDashboard.mobile.test.tsx components/logistics/__tests__/TrackingMobile.mobile.test.tsx components/logistics/__tests__/TripDetailsMobile.mobile.test.tsx components/tracking/__tests__/ClientMobileDashboard.mobile.test.tsx components/ui/__tests__/MobileButton.mobile.test.tsx components/ui/__tests__/BottomSheet.mobile.test.tsx components/ui/__tests__/DeliveryTimeline.mobile.test.tsx components/ui/__tests__/HorizontalFilter.mobile.test.tsx components/ui/__tests__/StatusChip.mobile.test.tsx
docker compose exec -T api sh -c "API_BASE_URL=http://localhost:8000/api/v1 API_SMOKE_DATABASE_URL=postgresql://laundry_user:laundry_pass@db:5432/laundry_express python verify_driver_operational_corridor.py"
git diff --check
```

Gate output:

```text
BUILD TYPESCRIPT                 : PASS
MOBILE SMOKE                     : PASS (10 files, 98 tests)
LOGISTICS SELF-SERVICE            : PASS
TENANT ISOLATION (HTTP)           : PASS
DRIVER OPERATIONAL CORRIDOR       : PASS
LOGISTICS TRUTH INVARIANTS (DB)   : PASS
MARKETPLACE SCALE READINESS       : PASS
WHITESPACE GATE                   : PASS
```

Pilot decision:

```text
Controlled Logistics Pilot : GO
Scale / Full Production    : HOLD until real pilot evidence
Pilot scope                : 1 company, 2 drivers, 5-10 missions
```

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
3. Ensure `Driver operational corridor gate` passes in the `truth-e2e` job.

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
