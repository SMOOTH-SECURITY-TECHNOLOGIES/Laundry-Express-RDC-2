# Role Access Drift Report

Date: 2026-03-18
Scope: backend route-level role references outside the currently proven MVP path

## Verdict

VERIFIED

The legacy role-name drift that referenced unsupported enum values has been removed.

## Current Source Of Truth

Supported roles in [user.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/app/models/user.py):
- `customer`
- `partner_owner`
- `partner_staff`
- `driver`
- `logistics_manager`
- `admin`
- `super_admin`

## What Was Repaired

- [dependencies.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/app/api/dependencies.py)
  - `get_current_admin` now accepts both `admin` and `super_admin`
  - `get_current_company` was replaced by `get_current_marketplace_operator`
  - shared role helpers were added for admin and partner access
- [marketplace.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/app/api/routes/marketplace.py)
  - removed unsupported `UserRole.COMPANY` assumptions
  - switched to the supported marketplace-operator dependency
- [logistics.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/app/api/routes/logistics.py)
  - replaced legacy partner-role checks with supported partner roles
- [disputes.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/app/api/routes/disputes.py)
  - replaced legacy partner-role checks with real partner access through `PartnerStaff`
- [commissions.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/app/api/routes/commissions.py)
  - replaced legacy partner-role checks with real partner access through `PartnerStaff`
  - fixed partner lookup to query `Partner` rather than a `User`
- Legacy test references were also updated in:
  - [test_payments_integration.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/tests/integration/test_payments_integration.py)
  - [test_payments_integration_fixed.py](c:/Users/PC/OneDrive/Desktop/Laundry-Express-RDC-2/apps/api/tests/integration/test_payments_integration_fixed.py)

## Current Boundary

This report only covers legacy role-name drift.

It does not claim that all non-MVP flows are fully integration-proven. It claims that the route layer no longer references unsupported enum values for those areas.

## Proof

- `python scripts/detect_legacy_role_drift.py` -> passes
- `cmd /c npm run test:role-drift` -> passes
- `python scripts/verify_role_access_matrix.py` -> passes

## Proof Boundary

This repo now has real local proof for:
- legacy role drift removal
- seeded credentials
- minimal role access matrix
- API smoke
- browser MVP path

It still does not have full end-to-end proof for every non-MVP business flow.
