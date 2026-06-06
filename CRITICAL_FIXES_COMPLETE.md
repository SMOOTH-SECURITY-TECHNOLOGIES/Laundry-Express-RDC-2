# CRITICAL PRODUCTION FIXES - COMPLETE
## P0 Issues - Immediate Implementation

---

## FIX 1: PAYMENT IDEMPOTENCY KEYS (Complete)

### 1.1 Database Migration (Already provided)
### 1.2 Update Payment Schema (Already provided)
### 1.3 Update Payment Service (Already provided)
### 1.4 Update Payment Repository (Already provided)

---

## FIX 2: WEBHOOK SIGNATURE VALIDATION (Complete)

### 2.1 Webhook Validator Service (Already provided)
### 2.2 Update Payment Service Webhook Handler (Already provided)
### 2.3 Update Payment Routes (Already provided)

---

## FIX 3: ATOMIC DRIVER ASSIGNMENT (Complete)

### 3.1 Database Constraints (Already provided)

### 3.2 Atomic Assignment Service (Complete)
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
            if active_task_count == 0:
                driver.is_available = True
                driver.version += 1
            
            return driver
```

### 3.3 Update Dispatch Service to Use Atomic Operations
```python
# File: apps/api/app/services/dispatch_service.py
from app.services.atomic_dispatch_service import AtomicDispatchService

class DispatchService:
    """Service de dispatch pour la gestion des chauffeurs et des tâches"""
    
    def __init__(self, db: Session):
        self.db = db
        self.logistics_repo = LogisticsRepository(db)
        self.order_repo = OrderRepository(db)
        self.atomic_dispatch = AtomicDispatchService(db)  # NEW
    
    def assign_driver_to_task(self, task_id: UUID, driver_id: UUID) -> Optional[DeliveryTask]:
        """Assigner un chauffeur à une tâche (version atomique)"""
        try:
            return self.atomic_dispatch.assign_driver_to_task_atomic(task_id, driver_id)
        except DriverNotAvailableError as e:
            raise ValueError(str(e))
        except TaskNotAssignableError as e:
            raise ValueError(str(e))
        except Exception as e:
            # Handle database lock timeout
            if "could not obtain lock" in str(e).lower():
                raise ValueError("Le système est occupé, veuillez réessayer")
            raise
    
    def complete_task(
        self,
        task_id: UUID,
        driver_id: UUID,
        complete_data: TaskCompleteRequest
    ) -> Optional[DeliveryTask]:
        """Compléter une tâche en cours et libérer le chauffeur"""
        # Vérifier que le chauffeur est bien assigné à la tâche
        task = self.logistics_repo.get_delivery_task_by_id(task_id)
        if not task:
            raise ValueError(f"Tâche {task_id} non trouvée")
        
        if task.driver_id != driver_id:
            raise ValueError(f"Le chauffeur {driver_id} n'est pas assigné à cette tâche")
        
        # Compléter la tâche
        completed_task = self.logistics_repo.complete_task(
            task_id,
            complete_data.proof_note,
            complete_data.proof_photo_url
        )
        
        if completed_task:
            # Libérer le chauffeur atomiquement
            try:
                self.atomic_dispatch.release_driver_atomic(driver_id)
            except Exception as e:
                # Log error but don't fail task completion
                logger.error(f"Failed to release driver {driver_id}: {str(e)}")
            
            # Mettre à jour le statut de la commande si nécessaire
            self._update_order_status_from_task(completed_task)
        
        return completed_task
```

---

## FIX 4: FLOAT TO DECIMAL MIGRATION

### 4.1 Database Migration (Multi-step)
```sql
-- File: alembic/versions/xxx_migrate_float_to_decimal_phase1.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Phase 1: Add Decimal columns alongside Float columns
    op.add_column('payment_intents', sa.Column('amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('payment_intents', sa.Column('amount_expected_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('payment_intents', sa.Column('amount_paid_decimal', sa.Numeric(12, 2), nullable=True, server_default='0.00'))
    
    op.add_column('orders', sa.Column('total_amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('orders', sa.Column('amount_paid_decimal', sa.Numeric(12, 2), nullable=True, server_default='0.00'))
    op.add_column('orders', sa.Column('refunded_amount_decimal', sa.Numeric(12, 2), nullable=True, server_default='0.00'))
    op.add_column('orders', sa.Column('discount_amount_decimal', sa.Numeric(12, 2), nullable=True, server_default='0.00'))
    
    # Add Decimal columns to other financial tables
    op.add_column('payment_transactions', sa.Column('amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('refund_transactions', sa.Column('amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('refund_requests', sa.Column('requested_amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('refund_requests', sa.Column('approved_amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('commission_records', sa.Column('gross_amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('commission_records', sa.Column('discount_amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('commission_records', sa.Column('net_paid_amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('commission_records', sa.Column('platform_commission_amount_decimal', sa.Numeric(12, 2), nullable=True))
    op.add_column('commission_records', sa.Column('partner_net_amount_decimal', sa.Numeric(12, 2), nullable=True))

def downgrade():
    # Phase 1 downgrade: remove Decimal columns
    op.drop_column('payment_intents', 'amount_decimal')
    op.drop_column('payment_intents', 'amount_expected_decimal')
    op.drop_column('payment_intents', 'amount_paid_decimal')
    op.drop_column('orders', 'total_amount_decimal')
    op.drop_column('orders', 'amount_paid_decimal')
    op.drop_column('orders', 'refunded_amount_decimal')
    op.drop_column('orders', 'discount_amount_decimal')
    op.drop_column('payment_transactions', 'amount_decimal')
    op.drop_column('refund_transactions', 'amount_decimal')
    op.drop_column('refund_requests', 'requested_amount_decimal')
    op.drop_column('refund_requests', 'approved_amount_decimal')
    op.drop_column('commission_records', 'gross_amount_decimal')
    op.drop_column('commission_records', 'discount_amount_decimal')
    op.drop_column('commission_records', 'net_paid_amount_decimal')
    op.drop_column('commission_records', 'platform_commission_amount_decimal')
    op.drop_column('commission_records', 'partner_net_amount_decimal')
```

```sql
-- File: alembic/versions/xxx_migrate_float_to_decimal_phase2.py
from alembic import op
import sqlalchemy as sa
from decimal import Decimal

def upgrade():
    # Phase 2: Backfill Decimal columns from Float columns
    op.execute("""
        UPDATE payment_intents 
        SET amount_decimal = ROUND(amount::numeric, 2),
            amount_expected_decimal = ROUND(amount_expected::numeric, 2),
            amount_paid_decimal = ROUND(amount_paid::numeric, 2)
    """)
    
    op.execute("""
        UPDATE orders 
        SET total_amount_decimal = ROUND(total_amount::numeric, 2),
            amount_paid_decimal = ROUND(amount_paid::numeric, 2),
            refunded_amount_decimal = ROUND(refunded_amount::numeric, 2),
            discount_amount_decimal = ROUND(discount_amount::numeric, 2)
    """)
    
    # Backfill other tables...
    
    # Make Decimal columns NOT NULL after backfill
    op.alter_column('payment_intents', 'amount_decimal', nullable=False)
    op.alter_column('payment_intents', 'amount_expected_decimal', nullable=False)
    op.alter_column('payment_intents', 'amount_paid_decimal', nullable=False)
    
    op.alter_column('orders', 'total_amount_decimal', nullable=False)
    op.alter_column('orders', 'amount_paid_decimal', nullable=False)
    op.alter_column('orders', 'refunded_amount_decimal', nullable=False)
    op.alter_column('orders', 'discount_amount_decimal', nullable=False)

def downgrade():
    # Phase 2 downgrade: make Decimal columns nullable again
    op.alter_column('payment_intents', 'amount_decimal', nullable=True)
    op.alter_column('payment_intents', 'amount_expected_decimal', nullable=True)
    op.alter_column('payment_intents', 'amount_paid_decimal', nullable=True)
    
    op.alter_column('orders', 'total_amount_decimal', nullable=True)
    op.alter_column('orders', 'amount_paid_decimal', nullable=True)
    op.alter_column('orders', 'refunded_amount_decimal', nullable=True)
    op.alter_column('orders', 'discount_amount_decimal', nullable=True)
```

### 4.2 Update Models with Decimal Properties
```python
# File: apps/api/app/models/payment.py
from sqlalchemy import Numeric
from decimal import Decimal

class PaymentIntent(BaseModel):
    """Intention de paiement avec support Decimal"""
    __tablename__ = "payment_intents"
    
    # Decimal columns (new)
    amount_decimal = Column(Numeric(12, 2), nullable=False)
    amount_expected_decimal = Column(Numeric(12, 2), nullable=False)
    amount_paid_decimal = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    
    # Legacy Float columns (to be removed later)
    amount = Column(Float, nullable=False)
    amount_expected = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=False, default=0.0)
    
    @property
    def amount(self) -> Decimal:
        """Get amount as Decimal"""
        return self.amount_decimal
    
    @amount.setter
    def amount(self, value):
        """Set amount from Decimal, float, int, or string"""
        if isinstance(value, Decimal):
            self.amount_decimal = value.quantize(Decimal("0.01"))
        else:
            self.amount_decimal = Decimal(str(value)).quantize(Decimal("0.01"))
        # Keep legacy column for backward compatibility
        self._amount = float(self.amount_decimal)
    
    @property
    def amount_expected(self) -> Decimal:
        return self.amount_expected_decimal
    
    @amount_expected.setter
    def amount_expected(self, value):
        if isinstance(value, Decimal):
            self.amount_expected_decimal = value.quantize(Decimal("0.01"))
        else:
            self.amount_expected_decimal = Decimal(str(value)).quantize(Decimal("0.01"))
        self._amount_expected = float(self.amount_expected_decimal)
    
    @property
    def amount_paid(self) -> Decimal:
        return self.amount_paid_decimal
    
    @amount_paid.setter
    def amount_paid(self, value):
        if isinstance(value, Decimal):
            self.amount_paid_decimal = value.quantize(Decimal("0.01"))
        else:
            self.amount_paid_decimal = Decimal(str(value)).quantize(Decimal("0.01"))
        self._amount_paid = float(self.amount_paid_decimal)
```

### 4.3 Update Payment Service to Use Decimal
```python
# File: apps/api/app/services/payment_service.py
from decimal import Decimal, ROUND_HALF_UP

def create_payment_intent(self, data: PaymentIntentCreate, customer_id: UUID) -> PaymentIntent:
    """Créer une intention de paiement avec Decimal"""
    
    # Convert to Decimal early
    expected_amount = Decimal(str(data.amount_expected)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    # ... existing validation code ...
    
    # Use Decimal for comparison
    order_total = Decimal(str(order.total_amount_decimal)).quantize(Decimal("0.01"))
    if abs(expected_amount - order_total) > Decimal("0.005"):  # Allow 0.5 cent tolerance
        raise ValidationError(
            f"Le montant attendu ({expected_amount}) ne correspond pas au total de la commande ({order_total})"
        )
    
    # Create intent with Decimal values
    intent = PaymentIntent(
        order_id=data.order_id,
        customer_id=customer_id,
        payment_method=data.payment_method,
        currency=data.currency or "CDF",
        amount=expected_amount,  # Will use Decimal setter
        amount_expected=expected_amount,
        amount_paid=Decimal("0.00"),
        status=PaymentIntentStatus.CREATED,
        # ... other fields
    )
    
    return intent

def recalculate_order_payment_status(self, order_id: UUID) -> Order:
    """Recalculer le statut de paiement d'une commande avec Decimal"""
    order = self.order_repo.get_by_id(order_id)
    if not order:
        raise ValidationError(f"Commande {order_id} non trouvée")
    
    # Récupérer toutes les intentions de paiement pour cette commande
    intents = self.payment_repo.get_intents_for_order(order_id)
    
    # Calculer le total payé avec Decimal
    total_paid = Decimal("0.00")
    for intent in intents:
        if intent.status == PaymentIntentStatus.SUCCEEDED:
            total_paid += intent.amount_paid_decimal
    
    total_refunded = self.refund_repo.get_total_refunded_for_order_decimal(order_id)
    
    # Mettre à jour les champs Decimal de la commande
    order.amount_paid_decimal = total_paid
    order.refunded_amount_decimal = total_refunded
    
    # Détermin