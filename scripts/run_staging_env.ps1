param(
    [string]$EnvFile = ".env.staging.local"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    Write-Host "Staging env runner" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Error "Missing env file: $EnvFile"
}

Write-Host "Staging env runner" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Loading: $EnvFile"

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^\s*#") { return }
    if ($_ -match "^\s*$") { return }

    $name, $value = $_ -split "=", 2
    if (-not $name) { return }

    if ($null -eq $value) {
        $value = ""
    }

    [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
}

Write-Host ""
Write-Host "1. Preflight" -ForegroundColor Yellow
python scripts/check_staging_prereqs.py
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Error "Stopping: staging prereqs failed."
}

Write-Host ""
Write-Host "2. Runtime flows" -ForegroundColor Yellow
python scripts/verify_staging_flows.py
exit $LASTEXITCODE
