param(
    [switch]$CheckOnly,
    [string]$ApiBaseUrl = "http://127.0.0.1:18000/api/v1",
    [string]$DatabaseUrl = "postgresql+asyncpg://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express",
    [string]$DatabaseUrlSync = "postgresql://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express",
    [string]$ProviderMode = "cash_only"
)

$ErrorActionPreference = "Stop"

Write-Host "Local staging simulation" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "API  : $ApiBaseUrl"
Write-Host "Async: $DatabaseUrl"
Write-Host "Sync : $DatabaseUrlSync"
Write-Host "Mode : $ProviderMode"

$env:STAGING_API_BASE_URL = $ApiBaseUrl
$env:STAGING_DATABASE_URL = $DatabaseUrl
$env:STAGING_DATABASE_URL_SYNC = $DatabaseUrlSync
$env:STAGING_PAYMENT_PROVIDER_MODE = $ProviderMode

if (-not $env:STAGING_ADMIN_EMAIL) { $env:STAGING_ADMIN_EMAIL = ${env:SEED_PLATFORM_ADMIN_EMAIL}; if (-not $env:STAGING_ADMIN_EMAIL) { $env:STAGING_ADMIN_EMAIL = "admin@laundryexpress.cd" } }
if (-not $env:STAGING_ADMIN_PASSWORD) {
    $platformAdminEmail = ${env:SEED_PLATFORM_ADMIN_EMAIL}
    if ($platformAdminEmail -and $platformAdminEmail -eq $env:STAGING_ADMIN_EMAIL) {
        $env:STAGING_ADMIN_PASSWORD = ${env:SEED_PLATFORM_ADMIN_PASSWORD}
    } elseif ($env:STAGING_ADMIN_EMAIL -eq "admin@laundryexpress.cd" -and ${env:SEED_SUPER_ADMIN_PASSWORD}) {
        $env:STAGING_ADMIN_PASSWORD = ${env:SEED_SUPER_ADMIN_PASSWORD}
    } else {
        $env:STAGING_ADMIN_PASSWORD = ${env:SEED_PLATFORM_ADMIN_PASSWORD}
    }
}
if (-not $env:STAGING_PARTNER_OWNER_EMAIL) { $env:STAGING_PARTNER_OWNER_EMAIL = ${env:SEED_PARTNER_OWNER_EMAIL}; if (-not $env:STAGING_PARTNER_OWNER_EMAIL) { $env:STAGING_PARTNER_OWNER_EMAIL = "owner@partner.com" } }
if (-not $env:STAGING_PARTNER_OWNER_PASSWORD) { $env:STAGING_PARTNER_OWNER_PASSWORD = ${env:SEED_PARTNER_OWNER_PASSWORD} }
if (-not $env:STAGING_DRIVER_EMAIL) { $env:STAGING_DRIVER_EMAIL = ${env:SEED_DRIVER_EMAIL}; if (-not $env:STAGING_DRIVER_EMAIL) { $env:STAGING_DRIVER_EMAIL = "driver1@kinexpress.cd" } }
if (-not $env:STAGING_DRIVER_PASSWORD) { $env:STAGING_DRIVER_PASSWORD = ${env:SEED_DRIVER_PASSWORD}; if (-not $env:STAGING_DRIVER_PASSWORD) { $env:STAGING_DRIVER_PASSWORD = "driverpass123" } }
if (-not $env:STAGING_LOGISTICS_EMAIL) { $env:STAGING_LOGISTICS_EMAIL = ${env:SEED_LOGISTICS_EMAIL}; if (-not $env:STAGING_LOGISTICS_EMAIL) { $env:STAGING_LOGISTICS_EMAIL = "logistics@laundryexpress.cd" } }
if (-not $env:STAGING_LOGISTICS_PASSWORD) { $env:STAGING_LOGISTICS_PASSWORD = ${env:SEED_LOGISTICS_PASSWORD} }

Write-Host ""
Write-Host "1. Preflight" -ForegroundColor Yellow
python scripts/check_staging_prereqs.py
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if ($CheckOnly) {
    Write-Host ""
    Write-Host "Check-only mode complete." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "2. Runtime flows" -ForegroundColor Yellow
python scripts/verify_staging_flows.py
exit $LASTEXITCODE
