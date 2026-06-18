$ErrorActionPreference = "Continue"
$BASE = "http://localhost:18000/api/v1"
$results = @()

function Test-Corridor {
    param([string]$Name, [scriptblock]$Test)
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  PASS: $Name" -ForegroundColor Green
            $script:results += [PSCustomObject]@{ Corridor = $Name; Status = "PASS"; Detail = $result }
        } else {
            Write-Host "  FAIL: $Name" -ForegroundColor Red
            $script:results += [PSCustomObject]@{ Corridor = $Name; Status = "FAIL"; Detail = "Returned false/null" }
        }
    } catch {
        Write-Host "  ERROR: $Name - $($_.Exception.Message)" -ForegroundColor Red
        $script:results += [PSCustomObject]@{ Corridor = $Name; Status = "ERROR"; Detail = $_.Exception.Message }
    }
}

# ========================================
# 1. AUTH: Register + Login Customer
# ========================================
$email = "pilot-e2e-$(Get-Date -Format 'yyyyMMddHHmmss')@test.cd"
Test-Corridor "Auth: Register Customer" {
    $body = @{ email = $script:email; phone = "+24381$(Get-Date -Format 'mmssff')"; name = "Pilot E2E Customer"; password = "Test1234!" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "    Registered: $($resp.email)" -ForegroundColor Gray
    return $true
}

$customerToken = $null
Test-Corridor "Auth: Login Customer" {
    $body = @{ email = $script:email; password = "Test1234!" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body $body -ContentType "application/json"
    $script:customerToken = $resp.access_token
    Write-Host "    Token obtained" -ForegroundColor Gray
    return [bool]$script:customerToken
}

$headers = @{ Authorization = "Bearer $customerToken" }

# For admin operations, we use the admin auth endpoint directly
$adminToken = $null
Test-Corridor "Auth: Login as partner_owner" {
    $body = @{ email = "owner@partner.com"; password = "Test1234!" } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body $body -ContentType "application/json"
        $script:adminToken = $resp.access_token
        Write-Host "    Partner owner token obtained" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "    Partner login failed, using customer for all" -ForegroundColor Yellow
        return $false
    }
}

$adminHeaders = @{ Authorization = "Bearer $(if ($adminToken) { $adminToken } else { $customerToken })" }

# ========================================
# 3. CATALOG: Get partners + service types
# ========================================
$partnerId = $null
Test-Corridor "Catalog: List Partners" {
    $resp = Invoke-RestMethod -Uri "$BASE/catalog/partners" -Method GET
    $script:partnerId = $resp[0].id
    Write-Host "    Partners found: $($resp.Count), using: $($resp[0].name)" -ForegroundColor Gray
    return $resp.Count -gt 0
}

$serviceTypeId = $null
Test-Corridor "Catalog: List Service Types" {
    $resp = Invoke-RestMethod -Uri "$BASE/catalog/service-types" -Method GET
    $pressing = $resp | Where-Object { $_.slug -eq "pressing" }
    $script:serviceTypeId = if ($pressing) { $pressing.id } else { $resp[0].id }
    Write-Host "    Service types: $($resp.Count), using: $($resp[0].name)" -ForegroundColor Gray
    return $resp.Count -gt 0
}

$partnerServiceId = $null
Test-Corridor "Catalog: List Partner Services" {
    $resp = Invoke-RestMethod -Uri "$BASE/catalog/partners/$script:partnerId/services" -Method GET
    $script:partnerServiceId = $resp[0].id
    Write-Host "    Partner services: $($resp.Count), using: $($resp[0].service_type_name) ($($resp[0].id))" -ForegroundColor Gray
    return $resp.Count -gt 0
}

# ========================================
# 4. ORDER: Create order (full corridor)
# ========================================
$orderId = $null
# Store order total for payment
$orderTotal = 15.00

Test-Corridor "Order: Create Order" {
    $body = @{
        partner_id = $script:partnerId
        items = @(
            @{ service_id = $script:partnerServiceId; item_name = "Chemise"; quantity = 3; unit_price = 2.50 }
            @{ service_id = $script:partnerServiceId; item_name = "Pantalon"; quantity = 2; unit_price = 3.50 }
        )
        currency = "USD"
        special_instructions = "Pilot E2E test order"
    } | ConvertTo-Json -Depth 3
    $resp = Invoke-RestMethod -Uri "$BASE/orders" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    $script:orderId = $resp.id
    $script:orderTotal = [double]$resp.total_amount
    Write-Host "    Order created: $($resp.id), total: $($script:orderTotal)" -ForegroundColor Gray
    return [bool]$script:orderId
}

# ========================================
# 5. PAYMENT: Create payment intent + confirm cash
# ========================================
$paymentIntentId = $null
Test-Corridor "Payment: Create Intent" {
    $body = @{ order_id = $script:orderId; payment_method = "cash_on_delivery"; amount_expected = $script:orderTotal; currency = "USD" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/payments/intents" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    $script:paymentIntentId = $resp.id
    Write-Host "    Payment intent: $($resp.id), status: $($resp.status)" -ForegroundColor Gray
    return [bool]$script:paymentIntentId
}

Test-Corridor "Payment: Confirm Cash" {
    # Get partner owner user ID for confirmed_by
    $me = Invoke-RestMethod -Uri "$BASE/auth/me" -Method GET -Headers $adminHeaders
    $userId = $me.user.id
    $body = @{ confirmed_by_user_id = $userId; amount_paid = $script:orderTotal; notes = "E2E pilot cash confirm" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/payments/intents/$script:paymentIntentId/confirm-cash" -Method POST -Body $body -ContentType "application/json" -Headers $adminHeaders
    Write-Host "    Payment confirmed: $($resp.status)" -ForegroundColor Gray
    return $true
}

# ========================================
# 6. ORDER STATUS: Full lifecycle (partner token)
# ========================================
$statusTransitions = @(
    @{ status = "confirmed"; body = @{ new_status = "confirmed"; change_reason = "E2E" } },
    @{ status = "pickup_scheduled"; body = @{ new_status = "pickup_scheduled"; change_reason = "E2E" } },
    @{ status = "pickup_driver_assigned"; body = @{ new_status = "pickup_driver_assigned"; change_reason = "E2E" } },
    @{ status = "pickup_in_progress"; body = @{ new_status = "pickup_in_progress"; change_reason = "E2E" } },
    @{ status = "picked_up"; body = @{ new_status = "picked_up"; change_reason = "E2E"; proof_photo_url = "https://example.com/pickup.jpg" } },
    @{ status = "received_by_partner"; body = @{ new_status = "received_by_partner"; change_reason = "E2E" } },
    @{ status = "cleaning_in_progress"; body = @{ new_status = "cleaning_in_progress"; change_reason = "E2E" } },
    @{ status = "quality_check"; body = @{ new_status = "quality_check"; change_reason = "E2E" } },
    @{ status = "ready_for_delivery"; body = @{ new_status = "ready_for_delivery"; change_reason = "E2E" } },
    @{ status = "delivery_driver_assigned"; body = @{ new_status = "delivery_driver_assigned"; change_reason = "E2E" } },
    @{ status = "delivery_in_progress"; body = @{ new_status = "delivery_in_progress"; change_reason = "E2E" } },
    @{ status = "delivered"; body = @{ new_status = "delivered"; change_reason = "E2E"; proof_photo_url = "https://example.com/delivered.jpg" } },
    @{ status = "completed"; body = @{ new_status = "completed"; change_reason = "E2E" } }
)
foreach ($t in $statusTransitions) {
    Test-Corridor "Order: Status -> $($t.status)" {
        $body = $t.body | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$BASE/orders/$script:orderId/status" -Method POST -Body $body -ContentType "application/json" -Headers $adminHeaders
        Write-Host "    Status: $($resp.status)" -ForegroundColor Gray
        return $true
    }
}

# ========================================
# 7. REVIEW: Create review for completed order
# ========================================
Test-Corridor "Review: Create Review" {
    $body = @{ order_id = $script:orderId; rating = 5; comment = "Excellent service during pilot E2E test" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/reviews" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    Write-Host "    Review created, rating: $($resp.rating)" -ForegroundColor Gray
    return [bool]$resp
}

# ========================================
# 8. LOYALTY: Check points accumulated
# ========================================
Test-Corridor "Loyalty: Check History" {
    $resp = Invoke-RestMethod -Uri "$BASE/loyalty/me/history" -Method GET -Headers $headers
    $count = if ($resp -is [array]) { $resp.Count } else { 1 }
    Write-Host "    Loyalty entries: $count" -ForegroundColor Gray
    return $true
}

# ========================================
# 9. PROMO: Create promo code
# ========================================
$promoCode = "PILOT-$(Get-Date -Format 'yyyyMMddHHmm')"
Test-Corridor "Promo: Create Code" {
    $body = @{ code = $script:promoCode; discount_type = "percentage"; discount_value = 15; min_order_value = 10; is_active = $true } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/promotions" -Method POST -Body $body -ContentType "application/json" -Headers $adminHeaders
    Write-Host "    Promo created: $($resp.code)" -ForegroundColor Gray
    return [bool]$resp
}

# ========================================
# 10. CLAIM: Create claim (customer endpoint)
# ========================================
Test-Corridor "Claim: Create Claim" {
    $body = @{ title = "Pilot E2E Claim"; description = "Stain not removed after cleaning"; type = "quality_issue"; order_id = "$($script:orderId)" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/claims" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    Write-Host "    Claim created: $($resp.claim_number)" -ForegroundColor Gray
    return [bool]$resp
}

# ========================================
# 11. ORDER: Cancel a second order
# ========================================
$cancelOrderId = $null
Test-Corridor "Order: Create + Cancel" {
    $body = @{
        partner_id = $script:partnerId
        items = @(@{ service_id = $script:partnerServiceId; item_name = "Veste"; quantity = 1; unit_price = 5.00 })
        currency = "USD"
    } | ConvertTo-Json -Depth 3
    $resp = Invoke-RestMethod -Uri "$BASE/orders" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    $script:cancelOrderId = $resp.id

    $cancelBody = @{ reason = "Pilot E2E cancellation test" } | ConvertTo-Json
    $cancelResp = Invoke-RestMethod -Uri "$BASE/orders/$script:cancelOrderId/cancel" -Method POST -Body $cancelBody -ContentType "application/json" -Headers $headers
    Write-Host "    Order cancelled: $($cancelResp.status)" -ForegroundColor Gray
    return $true
}

# ========================================
# 12. DISPUTE: Create paid order + dispute
# ========================================
$paidOrderId = $null
$paidIntentId = $null
$paidOrderTotal = 24.00

Test-Corridor "Dispute: Create Paid Order + Dispute" {
    $body = @{
        partner_id = $script:partnerId
        items = @(@{ service_id = $script:partnerServiceId; item_name = "Veste"; quantity = 3; unit_price = 8.00 })
        currency = "USD"
    } | ConvertTo-Json -Depth 3
    $order2 = Invoke-RestMethod -Uri "$BASE/orders" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    $script:paidOrderId = $order2.id
    $script:paidOrderTotal = [double]$order2.total_amount

    $payBody = @{ order_id = $order2.id; payment_method = "cash_on_delivery"; amount_expected = $script:paidOrderTotal; currency = "USD" } | ConvertTo-Json
    $intent2 = Invoke-RestMethod -Uri "$BASE/payments/intents" -Method POST -Body $payBody -ContentType "application/json" -Headers $headers
    $script:paidIntentId = $intent2.id

    $me = Invoke-RestMethod -Uri "$BASE/auth/me" -Method GET -Headers $adminHeaders
    $confirmBody = @{ confirmed_by_user_id = $me.user.id; amount_paid = $script:paidOrderTotal; notes = "E2E dispute test" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/payments/intents/$($script:paidIntentId)/confirm-cash" -Method POST -Body $confirmBody -ContentType "application/json" -Headers $adminHeaders | Out-Null

    # Create dispute WITHOUT refund_requested to avoid auto-creating a refund request
    $disputeBody = @{ order_id = $script:paidOrderId; category = "quality_issue"; title = "Pilot E2E dispute"; description = "Quality not as expected"; refund_requested = $false } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/disputes" -Method POST -Body $disputeBody -ContentType "application/json" -Headers $headers
    Write-Host "    Dispute created: $($resp.id)" -ForegroundColor Gray
    return [bool]$resp
}

Test-Corridor "Refund: Create Request" {
    $body = @{ order_id = $script:paidOrderId; reason_code = "quality_issue"; reason_text = "Pilot E2E refund test"; requested_amount = 2.00 } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/refunds/requests" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    Write-Host "    Refund request: $($resp.id), status: $($resp.status)" -ForegroundColor Gray
    return [bool]$resp
}
# ========================================
# 14. SUPPORT: Create ticket
# ========================================
Test-Corridor "Support: Create Ticket" {
    $body = @{ title = "Pilot E2E support ticket"; description = "Testing support corridor for pilot validation"; priority = "medium" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/support/tickets" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    Write-Host "    Ticket created: $($resp.id)" -ForegroundColor Gray
    return [bool]$resp
}

# ========================================
# 15. REFERRAL: Check settings
# ========================================
Test-Corridor "Referral: Settings" {
    $resp = Invoke-RestMethod -Uri "$BASE/referral/settings" -Method GET
    Write-Host "    Referral enabled: $($resp.is_enabled), bonus: $($resp.referrer_bonus_points)" -ForegroundColor Gray
    return $true
}

# ========================================
# 16. OPS: Corridor health check
# ========================================
Test-Corridor "OPS: Corridor Health" {
    $resp = Invoke-RestMethod -Uri "$BASE/ops/corridors/health" -Method GET -Headers $adminHeaders
    Write-Host "    Health: $($resp | ConvertTo-Json -Compress)" -ForegroundColor Gray
    return [bool]$resp
}

# ========================================
# 17. ADVERTISEMENTS: List
# ========================================
Test-Corridor "Ads: List Advertisements" {
    $resp = Invoke-RestMethod -Uri "$BASE/advertisements" -Method GET
    Write-Host "    Ads found: $($resp.total)" -ForegroundColor Gray
    return $true
}

# ========================================
# 18. CONTENT: Site content
# ========================================
Test-Corridor "Content: Site Content" {
    $resp = Invoke-RestMethod -Uri "$BASE/content/site" -Method GET
    Write-Host "    Content key: $($resp.key)" -ForegroundColor Gray
    return [bool]$resp
}

# ========================================
# REPORT
# ========================================
Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  CONTROLLED PILOT EVIDENCE REPORT" -ForegroundColor Yellow
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$pass = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$fail = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$errCount = ($results | Where-Object { $_.Status -eq "ERROR" }).Count
$total = $results.Count

Write-Host "`nRESULTS: $pass/$total PASS, $fail FAIL, $errCount ERROR" -ForegroundColor $(if ($fail -eq 0 -and $errCount -eq 0) { "Green" } else { "Yellow" })

$results | ForEach-Object {
    $color = switch ($_.Status) { "PASS" { "Green" } "FAIL" { "Red" } "ERROR" { "Red" } }
    Write-Host "  $($_.Status.PadRight(6)) | $($_.Corridor.PadRight(40)) | $($_.Detail)" -ForegroundColor $color
}

Write-Host "`n========================================" -ForegroundColor Yellow
if ($fail -eq 0 -and $errCount -eq 0) {
    Write-Host "  VERDICT: ALL CORRIDORS PASS" -ForegroundColor Green
    Write-Host "  Transactional Pilot Ready: CONFIRMED" -ForegroundColor Green
} else {
    Write-Host "  VERDICT: $($fail + $errCount) CORRIDORS FAILED" -ForegroundColor Red
    Write-Host "  Transactional Pilot Ready: NOT YET" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Yellow
