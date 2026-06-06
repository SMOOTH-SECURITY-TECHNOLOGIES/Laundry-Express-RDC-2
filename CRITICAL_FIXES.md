# CRITICAL PRODUCTION FIXES
## P0 Issues - Immediate Implementation

---

## FIX 1: PAYMENT IDEMPOTENCY KEYS

### 1.1 Database Migration
```sql
-- File: alembic/versions/xxx_add_idempotency_keys.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add idempotency_key columns
    op.add_column('payment_intents', sa.Column('idempotency_key', sa.String(128), nullable=True, unique=True))
    op.add_column('payment_transactions', sa.Column('idempotency_key', sa.String(128), nullable=True, unique=True))
    op.add_column('refund_transactions', sa.Column('idempotency_key', sa.String(128), nullable=True, unique=True))
    
    # Add composite unique constraint for order + idempotency_key
    op.create_unique_constraint(
        'uq_payment_intent_order_idempotency',
        'payment_intents',
        ['order_id', 'idempotency_key']
    )
    
    # Create index for faster lookups
    op.create_index(
        'idx_payment_intents_idempotency',
        'payment_intents',
        ['idempotency_key'],
        unique=True
    )

def downgrade():
    op.drop_constraint('uq_payment_intent_order_idempotency', 'payment_intents', type_='unique')
    op.drop_index('idx_payment_intents_idempotency', table_name='payment_intents')
    op.drop_column('payment_intents', 'idempotency_key')
    op.drop_column('payment_transactions', 'idempotency_key')
    op.drop_column('refund_transactions', 'idempotency_key')
```

### 1.2 Update Payment Schema
```python
# File: apps/api/app/schemas/payment.py
from pydantic import Field, validator
import uuid

class PaymentIntentCreate(BaseModel):
    """Schéma pour créer une intention de paiement"""
    order_id: UUID
    payment_method: PaymentMethod
    amount_expected: float = Field(gt=0, description="Montant attendu")
    currency: str = "CDF"
    provider_name: Optional[PaymentProvider] = None
    expires_at: Optional[datetime] = None
    payment_metadata: Optional[dict[str, Any]] = None
    idempotency_key: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Clé d'idempotence générée par le client pour éviter les doublons"
    )
    
    @validator("idempotency_key")
    def validate_idempotency_key(cls, v):
        if not v or not v.strip():
            raise ValueError("idempotency_key ne peut pas être vide")
        return v.strip()
```

### 1.3 Update Payment Service
```python
# File: apps/api/app/services/payment_service.py
from sqlalchemy.exc import IntegrityError

def create_payment_intent(self, data: PaymentIntentCreate, customer_id: UUID) -> PaymentIntent:
    """Créer une intention de paiement avec idempotence"""
    
    # Vérifier d'abord par idempotency_key
    existing_intent = self.payment_repo.get_intent_by_idempotency_key(data.idempotency_key)
    if existing_intent:
        # Idempotency: retourner l'intention existante
        return existing_intent
    
    # Vérifier que la commande existe
    order = self.order_repo.get_by_id(data.order_id)
    if not order:
        raise ValidationError(f"Commande {data.order_id} non trouvée")
    
    # Vérifier que le client est bien le propriétaire de la commande
    if str(order.customer_id) != str(customer_id):
        raise ValidationError("Le client n'est pas propriétaire de cette commande")
    
    # Vérifier qu'il n'y a pas déjà une intention de paiement active (race condition protection)
    existing_active = self.payment_repo.get_active_intent_for_order(data.order_id)
    if existing_active:
        raise PaymentError(f"Une intention de paiement existe déjà pour cette commande: {existing_active.id}")
    
    if order.payment_status in {
        OrderPaymentStatus.PAID,
        OrderPaymentStatus.REFUNDED,
        OrderPaymentStatus.PARTIALLY_REFUNDED,
    }:
        raise PaymentError(
            f"Impossible de créer une nouvelle intention pour une commande déjà soldée: {order.payment_status}"
        )
    
    # Calculer le montant attendu
    order_total = Decimal(str(order.total_amount))
    expected_amount = Decimal(str(data.amount_expected))
    if abs(expected_amount - order_total) > Decimal("0.01"):
        raise ValidationError(
            f"Le montant attendu ({data.amount_expected}) ne correspond pas au total de la commande ({order.total_amount})"
        )
    
    # Créer l'intention de paiement
    intent = PaymentIntent(
        order_id=data.order_id,
        customer_id=customer_id,
        payment_method=data.payment_method,
        currency=data.currency or "CDF",
        amount=float(expected_amount),
        amount_expected=float(expected_amount),
        amount_paid=0.0,
        status=PaymentIntentStatus.CREATED,
        provider=provider_name.value if provider_name else None,
        provider_name=provider_name,
        expires_at=data.expires_at or (datetime.utcnow() + timedelta(hours=24)),
        payment_metadata=json.dumps(data.payment_metadata) if data.payment_metadata is not None else None,
        idempotency_key=data.idempotency_key,  # NEW
    )
    
    try:
        self.db.add(intent)
        self.db.flush()  # Flush to check constraints
        self.db.commit()
        self.db.refresh(intent)
    except IntegrityError as e:
        self.db.rollback()
        # Integrity error could be duplicate idempotency_key
        # Try to find existing intent
        existing = self.payment_repo.get_intent_by_idempotency_key(data.idempotency_key)
        if existing:
            return existing
        raise PaymentError(f"Erreur d'intégrité lors de la création de l'intention: {str(e)}")
    
    return intent
```

### 1.4 Update Payment Repository
```python
# File: apps/api/app/repositories/payment_repository.py
class PaymentRepository:
    def get_intent_by_idempotency_key(self, idempotency_key: str) -> Optional[PaymentIntent]:
        """Récupérer une intention de paiement par sa clé d'idempotence"""
        return self.db.query(PaymentIntent).filter(
            PaymentIntent.idempotency_key == idempotency_key
        ).first()
```

---

## FIX 2: WEBHOOK SIGNATURE VALIDATION

### 2.1 Webhook Validator Service
```python
# File: apps/api/app/services/webhook_validator.py
import hmac
import hashlib
import json
from typing import Optional
from app.models.payment import PaymentProvider

class WebhookValidator:
    """Validate webhook signatures from payment providers"""
    
    def __init__(self):
        self.secrets = {
            PaymentProvider.ORANGE_MONEY_RDC: os.getenv("ORANGE_MONEY_WEBHOOK_SECRET"),
            PaymentProvider.AIRTEL_MONEY_RDC: os.getenv("AIRTEL_MONEY_WEBHOOK_SECRET"),
            PaymentProvider.VODACOM_MPESA: os.getenv("VODACOM_MPESA_WEBHOOK_SECRET"),
        }
    
    def validate_signature(
        self,
        provider: PaymentProvider,
        payload: bytes,
        signature: str,
        timestamp: Optional[int] = None
    ) -> bool:
        """
        Validate webhook signature using HMAC-SHA256
        
        Args:
            provider: Payment provider
            payload: Raw request body as bytes
            signature: Signature from X-Signature header
            timestamp: Timestamp from X-Timestamp header (for replay protection)
        
        Returns:
            bool: True if signature is valid
        """
        secret = self.secrets.get(provider)
        if not secret:
            raise ValueError(f"No webhook secret configured for {provider}")
        
        # Replay protection (5 minute window)
        if timestamp:
            current_time = int(datetime.utcnow().timestamp())
            if abs(current_time - timestamp) > 300:  # 5 minutes
                return False
        
        # Compute expected signature
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(expected_signature, signature)
    
    def validate_stripe_signature(self, payload: bytes, signature: str, secret: str) -> bool:
        """Validate Stripe-style webhook signatures"""
        import stripe
        try:
            stripe.Webhook.construct_event(payload, signature, secret)
            return True
        except stripe.error.SignatureVerificationError:
            return False
```

### 2.2 Update Payment Service Webhook Handler
```python
# File: apps/api/app/services/payment_service.py
from app.services.webhook_validator import WebhookValidator

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.refund_repo = RefundRepository(db)
        self.dispute_repo = DisputeRepository(db)
        self.commission_repo = CommissionRepository(db)
        self.webhook_validator = WebhookValidator()  # NEW
    
    def record_provider_callback(self, provider: PaymentProvider, data: ProviderWebhookRequest) -> Tuple[PaymentIntent, PaymentTransaction]:
        """Enregistrer un callback d'un fournisseur de paiement avec validation de signature"""
        
        # Validate webhook signature
        payload_bytes = json.dumps(data.payload, sort_keys=True).encode('utf-8')
        
        if not self.webhook_validator.validate_signature(
            provider=provider,
            payload=payload_bytes,
            signature=data.signature,
            timestamp=data.timestamp
        ):
            raise PaymentError("Signature de webhook invalide")
        
        # Extract IDs from payload
        payload = data.payload
        transaction_id = payload.get("transaction_id")
        intent_id = payload.get("payment_intent_id")
        provider_event_id = payload.get("provider_event_id")
        
        if not intent_id:
            raise PaymentError("ID d'intention de paiement manquant dans le payload")
        
        # Check for duplicate webhook by provider_event_id
        if provider_event_id:
            existing_event = self.payment_repo.get_event_by_provider_id(provider_event_id)
            if existing_event:
                # Duplicate webhook, return existing result
                return existing_event.payment_intent, existing_event
        
        intent = self.payment_repo.get_intent_by_id(UUID(intent_id))
        if not intent:
            raise PaymentError(f"Intention de paiement {intent_id} non trouvée")
        
        # Create or update payment provider event
        provider_event = PaymentProviderEvent(
            payment_intent_id=intent.id,
            event_type=data.event_type,
            event_data=json.dumps(payload),
            provider=provider,
            provider_event_id=provider_event_id
        )
        self.db.add(provider_event)
        
        # Rest of existing logic...
        # ... [existing code for updating transaction and intent status]
        
        return intent, transaction
```

### 2.3 Update Payment Routes
```python
# File: apps/api/app/api/routes/payments.py
from fastapi import Header, HTTPException

@router.post("/webhook/{provider}")
async def handle_payment_webhook(
    provider: PaymentProvider,
    payload: dict = Body(...),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    x_timestamp: Optional[int] = Header(None, alias="X-Timestamp"),
    db: Session = Depends(get_db)
):
    """
    Handle payment provider webhooks with signature validation
    """
    if not x_signature:
        raise HTTPException(status_code=400, detail="Signature header missing")
    
    # Create webhook request
    webhook_request = ProviderWebhookRequest(
        provider=provider,
        event_type=payload.get("event_type", "payment.succeeded"),
        payload=payload,
        signature=x_signature,
        timestamp=x_timestamp
    )
    
    # Process webhook
    payment_service = PaymentService(db)
    try:
        intent, transaction = payment_service.record_provider_callback(provider, webhook_request)
        return {
            "success": True,
            "payment_intent_id": intent.id,
            "transaction_id": transaction.id if transaction else None
        }
    except PaymentError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log but don't expose internal errors
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## FIX 3: ATOMIC DRIVER ASSIGNMENT

### 3.1 Database Constraints
```sql
-- File: alembic/versions/xxx_add_driver_assignment_constraints.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add version columns for optimistic locking
    op.add_column('drivers', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('delivery_tasks', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
    
    # Add constraint: driver can only have one active task
    # Note: PostgreSQL exclusion constraint would be better but complex
    # We'll implement this in application logic with proper locking
    
    # Add index for faster active task queries
    op.create_index(
        'idx_delivery_tasks_active_driver',
        'delivery_tasks',
        ['driver_id'],
        postgresql_where=sa.text("status IN ('accepted', 'in_progress')")
    )

def downgrade():
    op.drop_index('idx_delivery_tasks_active_driver', table_name='delivery_tasks')
    op.drop_column('delivery_tasks', 'version')
    op.drop_column('drivers', 'version')
```

### 3.2 Atomic Assignment Service
```python
# File: apps/api/app/services/atomic_dispatch_service.py
from sqlalchemy import select, update
from sqlalchemy.orm import with_for_update
from app.exceptions import DriverNotAvailableError, TaskNotAssignableError

class AtomicDispatchService:
    """Dispatch service with atomic operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def assign_driver_to_task_atomic(self, task_id: UUID, driver_id: UUID) -> DeliveryTask:
        """
        Assign driver to task atomically using SELECT FOR UPDATE
        
        This prevents race conditions where two tasks try to assign
        the same driver simultaneously.
        """
        with self.db.begin_nested():  # Use nested transaction for atomicity
            # Lock driver and task rows
            driver = self.db.execute(
                select(Driver)
                .where(Driver.id == driver_id)
                .with_for_update(nowait=True)  # Fail fast if locked
            ).scalar_one_or_none()
            
            task = self.db.execute(
                select(DeliveryTask)
                .where(DeliveryTask.id == task_id)
                .with_for_update(nowait=True)
            ).scalar_one_or_none()
            
            if not driver:
                raise ValueError(f"Driver {driver_id} not found")
            if not task:
                raise ValueError(f"Task {task_id} not found")
            
            # Validate driver availability
            if not driver.is_available:
                raise DriverNotAvailableError(f"Driver {driver_id} is not available")
            
            # Validate task status
            if task.status != DeliveryTaskStatus.PENDING:
                raise TaskNotAssignableError(
                    f"Task {task_id} is not in PENDING status: {task.status}"
                )
            
            # Check if driver already has active task
            active_task_count = self.db.execute(
                select(sa.func.count(DeliveryTask.id))
                .where(
                    DeliveryTask.driver_id == driver_id,
                    DeliveryTask.status.in_([
                        DeliveryTaskStatus.ACCEPTED,
                        DeliveryTaskStatus.IN_PROGRESS
                    ])
                )
            ).scalar()
            
            if active_task_count > 0:
                raise DriverNotAvailableError(
                    f"Driver {driver_id} already has {active_task_count} active task(s)"
                )
            
            # Perform atomic update
            driver.is_available = False
            driver.version += 1
            
            task.driver_id = driver_id
            task.status = DeliveryTaskStatus.DRIVER_ASSIGNED
            task.assigned_at = datetime.utcnow()
            task.version += 1
            
            # Flush changes
            self.db.flush()
            
            return task
    
    def release_driver_atomic(self, driver_id: UUID) -> Driver:
        """Release driver atomically"""
        with self.db.begin_nested():
            driver = self.db.execute(
                select(Driver)
                .where(Driver.id == driver_id)
                .with_for_update(nowait=True)
            ).scalar_one_or_none()
            
            if not driver:
                raise ValueError(f"Driver {driver_id} not found")
            
            # Check if driver has any active tasks
            active_task_count = self.db.execute(
                select(sa.func.count(DeliveryTask.id))
                .where(
                    DeliveryTask.driver_id == driver_id,
                    DeliveryTask.status.in_([
                        DeliveryTaskStatus.ACCEPTED,
                        DeliveryTaskStatus.IN_PROGRESS
                    ])
                )
            ).scalar()
            
            # Only mark available if no active tasks
            if active_task_count == 