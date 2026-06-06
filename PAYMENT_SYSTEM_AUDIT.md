# PAYMENT SYSTEM AUDIT
## Fintech Backend Expert Analysis
**Focus:** Real money at risk, idempotency, duplicate payment risk, failure handling

---

## CRITICAL RISKS

### 1. NO IDEMPOTENCY KEY IN PAYMENT INTENT CREATION
**Location:** `payment_service.py:create_payment_intent()`
```python
def create_payment_intent(self, data: PaymentIntentCreate, customer_id: UUID) -> PaymentIntent:
    # NO idempotency_key parameter
    # NO check for duplicate requests
    # NO atomic INSERT ... ON CONFLICT
```
**Impact:** Network retries create duplicate payment intents.
**Real-world:** Customer charged twice for same order.
**Severity:** P0 - FINANCIAL LOSS

### 2. RACE CONDITION: CHECK-THEN-CREATE
**Location:** `payment_service.py:create_payment_intent()`
```python
existing_intent = self.payment_repo.get_active_intent_for_order(data.order_id)
if existing_intent:
    raise PaymentError(...)
# Race window: Two concurrent requests both check, find nothing, both create
```
**Impact:** Two active payment intents for same order.
**Real-world:** Customer pays twice, double charge.
**Severity:** P0 - FINANCIAL LOSS

### 3. NO WEBHOOK SIGNATURE VALIDATION
**Location:** `payment_service.py:record_provider_callback()`
```python
def record_provider_callback(self, provider: PaymentProvider, data: ProviderWebhookRequest):
    # TODO: Implémenter la logique de validation de signature
    # NO signature validation
    # NO HMAC verification
    # NO timestamp validation
```
**Impact:** Fraudulent webhooks can mark payments as successful.
**Real-world:** Fake payment notifications, goods delivered without payment.
**Severity:** P0 - FINANCIAL FRAUD

### 4. FLOAT FOR MONETARY AMOUNTS
**Location:** `models/payment.py`
```python
amount = Column(Float, nullable=False)
amount_expected = Column(Float, nullable=False)
amount_paid = Column(Float, nullable=False, default=0.0)
```
**Impact:** Floating point rounding errors in financial calculations.
**Real-world:** $10.00 becomes $9.999999, commission calculations wrong.
**Severity:** P1 - FINANCIAL PRECISION

### 5. NO TRANSACTION ISOLATION IN PAYMENT STATUS UPDATE
**Location:** `payment_service.py:recalculate_order_payment_status()`
```python
def recalculate_order_payment_status(self, order_id: UUID):
    order = self.order_repo.get_by_id(order_id)
    intents = self.payment_repo.get_intents_for_order(order_id)
    # NO database lock on order or intents
    # Concurrent updates can cause race conditions
```
**Impact:** Payment status desynchronized from actual payments.
**Real-world:** Order marked paid with only partial payment.
**Severity:** P1 - FINANCIAL INTEGRITY

### 6. LOYALTY/REFERRAL AWARDS NOT ATOMIC WITH PAYMENT
**Location:** `payment_service.py:recalculate_order_payment_status()`
```python
if previous_payment_status != OrderPaymentStatus.PAID and order.payment_status == OrderPaymentStatus.PAID:
    self._award_loyalty_points_if_needed(order)
    self._award_referral_bonus_if_needed(order)
# Called AFTER payment status update commit
# NOT in same transaction
```
**Impact:** Payment succeeds but loyalty points not awarded (or vice versa).
**Real-world:** Customer pays, gets no loyalty points, support nightmare.
**Severity:** P1 - CUSTOMER SATISFACTION

---

## DOUBLE PAYMENT RISKS

### 1. MOBILE MONEY SIMULATION WITHOUT IDEMPOTENCY
**Location:** `payment_service.py:_simulate_mobile_money_payment()`
```python
def _simulate_mobile_money_payment(self, intent: PaymentIntent, transaction: PaymentTransaction):
    # Simulates payment without idempotency check
    # If called twice (network retry), creates duplicate successful transactions
```
**Impact:** Double charge for mobile money payments.
**Real-world:** Customer SMS shows two deductions for same order.

### 2. CASH PAYMENT CONFIRMATION RACE
**Location:** `payment_service.py:confirm_cash_payment()`
```python
def confirm_cash_payment(self, intent_id: UUID, data: CashPaymentConfirmRequest):
    # NO lock on payment intent
    # Two admins can confirm same cash payment simultaneously
```
**Impact:** Cash payment recorded twice.
**Real-world:** Driver collects cash once, system shows double payment.

### 3. WEBHOOK REPLAY ATTACK
**Location:** `payment_service.py:record_provider_callback()`
```python
# NO idempotency check for webhook events
# NO deduplication by provider_event_id
# Same webhook processed multiple times
```
**Impact:** Payment marked successful multiple times.
**Real-world:** Single payment triggers multiple order completions.

### 4. REFUND PROCESSING WITHOUT DEDUPLICATION
**Location:** `payment_service.py:process_refund()`
```python
def process_refund(self, refund_request_id: UUID):
    # NO idempotency check
    # If called twice (retry), creates duplicate refund transactions
```
**Impact:** Customer refunded twice.
**Real-world:** Financial loss from double refunds.

---

## FAILURE SCENARIOS

### 1. NETWORK PARTITION DURING PAYMENT INTENT CREATION
**Scenario:** Client POST /payment-intents, backend creates record but network fails before response.
**Current behavior:** Client retries, creates duplicate payment intent.
**Missing:** Client-generated idempotency key with unique constraint.

### 2. PAYMENT PROVIDER TIMEOUT
**Scenario:** Mobile money API times out after 30s, status unknown.
**Current behavior:** Payment intent stuck in PENDING, no retry logic.
**Missing:** Async job with retry policy, timeout handling.

### 3. DATABASE DEADLOCK DURING PAYMENT STATUS UPDATE
**Scenario:** Concurrent webhook and cash confirmation try to update same order.
**Current behavior:** One fails with deadlock, inconsistent state.
**Missing:** Optimistic locking with retry, or SELECT FOR UPDATE NOWAIT.

### 4. WEBHOOK PROCESSING FAILURE
**Scenario:** Webhook received but payment service throws exception.
**Current behavior:** Webhook lost, payment never recorded.
**Missing:** Dead letter queue, manual reprocessing capability.

### 5. CURRENCY CONVERSION FAILURE
**Scenario:** Order in CDF, payment in USD, conversion rate API down.
**Current behavior:** Payment fails or uses stale rate.
**Missing:** Fallback to last known rate, manual override capability.

### 6. COMMISSION CALCULATION FAILURE
**Scenario:** Payment succeeds but commission calculation throws exception.
**Current behavior:** Commission not calculated, partner not paid.
**Missing:** Compensation transaction, manual trigger.

---

## MONEY LOSS SCENARIOS

### 1. DOUBLE PAYMENT → DOUBLE REFUND
**Path:** Duplicate payment intent → Customer complains → Support issues double refund.
**Loss:** 2x order amount.

### 2. FRAUDULENT WEBHOOK → FREE SERVICE
**Path:** Attacker sends fake "payment succeeded" webhook → Order marked paid → Goods delivered.
**Loss:** 1x order amount + cost of goods.

### 3. CASH PAYMENT THEFT
**Path:** Driver collects cash, doesn't confirm in app → Customer complains → Support issues refund.
**Loss:** 1x order amount (paid to driver AND refunded to customer).

### 4. LOYALTY POINTS OVER-AWARD
**Path:** Payment status update race condition awards loyalty points multiple times.
**Loss:** Redeemable points value.

### 5. COMMISSION UNDER-CALCULATION
**Path:** Floating point error in commission calculation → Partner underpaid.
**Loss:** Partner trust, potential legal liability.

### 6. REFUND TO WRONG ACCOUNT
**Path:** No validation that refund goes to original payment method.
**Loss:** 1x refund amount + regulatory fines.

---

## FIXES (STRICT ORDER)

### 1. IMMEDIATE: ADD IDEMPOTENCY KEYS (24 HOURS)
```sql
-- Database migration
ALTER TABLE payment_intents ADD COLUMN idempotency_key VARCHAR(128) UNIQUE;
ALTER TABLE payment_intents ADD CONSTRAINT unique_order_idempotency UNIQUE (order_id, idempotency_key);

ALTER TABLE payment_transactions ADD COLUMN idempotency_key VARCHAR(128) UNIQUE;
ALTER TABLE refund_transactions ADD COLUMN idempotency_key VARCHAR(128) UNIQUE;
```

```python
# Update PaymentIntentCreate schema
class PaymentIntentCreate(BaseModel):
    idempotency_key: str = Field(..., min_length=1, max_length=128)
    # ... existing fields

# Update create_payment_intent
def create_payment_intent(self, data: PaymentIntentCreate, customer_id: UUID):
    try:
        intent = PaymentIntent(
            idempotency_key=data.idempotency_key,
            # ... other fields
        )
        self.db.add(intent)
        self.db.flush()
    except IntegrityError:
        # Idempotency key conflict
        self.db.rollback()
        existing = self.payment_repo.get_by_idempotency_key(data.idempotency_key)
        return existing
```

### 2. IMMEDIATE: WEBHOOK SIGNATURE VALIDATION (24 HOURS)
```python
class WebhookValidator:
    def __init__(self):
        self.secrets = {
            PaymentProvider.ORANGE_MONEY_RDC: os.getenv("ORANGE_MONEY_WEBHOOK_SECRET"),
            PaymentProvider.AIRTEL_MONEY_RDC: os.getenv("AIRTEL_MONEY_WEBHOOK_SECRET"),
        }
    
    def validate_signature(self, provider: PaymentProvider, payload: bytes, signature: str) -> bool:
        secret = self.secrets.get(provider)
        if not secret:
            raise PaymentError(f"No webhook secret configured for {provider}")
        
        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected, signature)

# Update record_provider_callback
def record_provider_callback(self, provider: PaymentProvider, data: ProviderWebhookRequest):
    if not self.webhook_validator.validate_signature(provider, json.dumps(data.payload).encode(), data.signature):
        raise PaymentError("Invalid webhook signature")
    
    # Deduplicate by provider_event_id
    if data.payload.get("provider_event_id"):
        existing = self.payment_repo.get_event_by_provider_id(data.payload["provider_event_id"])
        if existing:
            return existing.payment_intent, existing
    
    # ... rest of processing
```

### 3. CRITICAL: FLOAT TO DECIMAL MIGRATION (48 HOURS)
```sql
-- Phase 1: Add Decimal columns
ALTER TABLE payment_intents ADD COLUMN amount_decimal NUMERIC(12, 2);
ALTER TABLE payment_intents ADD COLUMN amount_expected_decimal NUMERIC(12, 2);
ALTER TABLE payment_intents ADD COLUMN amount_paid_decimal NUMERIC(12, 2);

-- Phase 2: Backfill data
UPDATE payment_intents SET 
    amount_decimal = amount::NUMERIC(12, 2),
    amount_expected_decimal = amount_expected::NUMERIC(12, 2),
    amount_paid_decimal = amount_paid::NUMERIC(12, 2);

-- Phase 3: Switch application to use Decimal columns
-- Phase 4: Drop Float columns (after verification)
```

```python
# Update model
from sqlalchemy import Numeric

class PaymentIntent(BaseModel):
    amount_decimal = Column(Numeric(12, 2), nullable=False)
    amount_expected_decimal = Column(Numeric(12, 2), nullable=False)
    amount_paid_decimal = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    
    @property
    def amount(self) -> Decimal:
        return self.amount_decimal
    
    @amount.setter
    def amount(self, value: Decimal | float | int | str):
        self.amount_decimal = Decimal(str(value)).quantize(Decimal("0.01"))
```

### 4. HIGH: TRANSACTIONAL SAFETY (72 HOURS)
```python
def recalculate_order_payment_status(self, order_id: UUID) -> Order:
    with self.db.begin_nested():
        # Lock order and payment intents
        order = self.db.query(Order).with_for_update().get(order_id)
        intents = self.db.query(PaymentIntent).with_for_update().filter(
            PaymentIntent.order_id == order_id
        ).all()
        
        # Calculate with locks held
        total_paid = sum(intent.amount_paid_decimal for intent in intents if intent.status == PaymentIntentStatus.SUCCEEDED)
        
        # Validate: Cannot overpay
        if total_paid > order.total_amount:
            raise OverpaymentError(f"Paid {total_paid}, order total {order.total_amount}")
        
        # Update order
        order.amount_paid = total_paid
        order.payment_status = self._determine_payment_status(total_paid, order.total_amount)
        
        # Award loyalty/referral IN SAME TRANSACTION
        if order.payment_status == OrderPaymentStatus.PAID:
            self._award_loyalty_points_if_needed(order)
            self._award_referral_bonus_if_needed(order)
        
        return order
```

### 5. HIGH: RETRY LOGIC WITH EXPONENTIAL BACKOFF (1 WEEK)
```python
class PaymentRetryHandler:
    def __init__(self, db: Session, redis_client):
        self.db = db
        self.redis = redis_client
        self.max_retries = 5
        self.base_delay = 1  # seconds
    
    def process_with_retry(self, payment_intent_id: UUID):
        retry_key = f"payment_retry:{payment_intent_id}"
        retry_count = self.redis.incr(retry_key)
        
        if retry_count > self.max_retries:
            self.redis.delete(retry_key)
            self._move_to_dead_letter_queue(payment_intent_id)
            return
        
        try:
            # Process payment
            self._process_payment(payment_intent_id)
            self.redis.delete(retry_key)
        except (PaymentError, TimeoutError) as e:
            # Schedule retry
            delay = self.base_delay * (2 ** (retry_count - 1))
            self._schedule_retry(payment_intent_id, delay)
        except Exception as e:
            # Fatal error, no retry
            self.redis.delete(retry_key)
            raise
```

### 6. MEDIUM: AUDIT TRAIL AND RECONCILIATION (2 WEEKS)
```python
class PaymentAuditService:
    def reconcile_daily(self, date: date):
        # 1. Get all payment intents for date
        intents = self.payment_repo.get_intents_by_date(date)
        
        # 2. Group by provider
        by_provider = defaultdict(list)
        for intent in intents:
            by_provider[intent.provider_name].append(intent)
        
        # 3. Fetch provider statements
        discrepancies = []
        for provider, provider_intents in by_provider.items():
            statement = self._fetch_provider_statement(provider, date)
            discrepancies.extend(self._compare_with_statement(provider_intents, statement))
        
        # 4. Generate reconciliation report
        report = self._generate_reconciliation_report(discrepancies)
        
        # 5. Alert on unresolved discrepancies
        if report.unresolved_count > 0:
            self._alert_finance_team(report)
        
        return report
```

---

## VERDICT

**PAYMENT SYSTEM STATUS: BROKEN**

**DO NOT PROCESS REAL PAYMENTS WITH THIS SYSTEM.**

The identified issues will cause:
- Financial loss from double charges
- Fraud from unvalidated webhooks
- Customer disputes from inconsistent states
- Regulatory non-compliance from poor audit trails

**IMMEDIATE ACTION REQUIRED:**
1. Stop all payment processing
2. Implement idempotency keys
3. Add webhook signature validation
4. Migrate from Float to Decimal

**Only after these fixes are deployed and tested should real money be processed.**