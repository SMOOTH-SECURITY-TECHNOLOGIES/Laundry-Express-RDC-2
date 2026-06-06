# CORRIDOR TRUTH ENGINE — SPECIFICATION TECHNIQUE
## Laundry Express — Document de Conception v1.0

---

## 1. PHILOSOPHIE

**Principe fondamental :**
> *Aucune transition de statut métier ne peut exister sans preuve vérifiable, immuable et horodatée.*

**Ce que cela signifie concrètement :**
- `DELIVERED` sans photo + géoloc + timestamp = transition bloquée
- `PAID` sans transaction confirmée + webhook validé = transition bloquée
- `PICKED_UP` sans preuve de prise en charge = transition bloquée
- `READY_FOR_DELIVERY` sans QC passé = transition bloquée

---

## 2. CONCEPTS CENTRAUX

### 2.1 Preuve Opérationnelle (OperationalProof)

```python
class OperationalProof(BaseModel):
    """Preuve immuable attachée à une transition de statut"""
    __tablename__ = "operational_proofs"

    id = Column(UUID, primary_key=True)
    order_id = Column(UUID, ForeignKey("orders.id"), nullable=False, index=True)
    
    # Quoi
    proof_type = Column(String(50), nullable=False)  # photo, signature, webhook, system, manual
    proof_data = Column(JSONB, nullable=False)  # {url, hash, metadata}
    
    # Qui
    actor_type = Column(String(50), nullable=False)  # customer, driver, partner, system, admin
    actor_id = Column(UUID, nullable=False)
    actor_name = Column(String(255), nullable=False)
    
    # Quand
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Où
    location_lat = Column(Numeric(10, 8), nullable=True)
    location_lng = Column(Numeric(11, 8), nullable=True)
    location_accuracy = Column(Numeric(5, 2), nullable=True)  # en mètres
    
    # Immutabilité
    blockchain_hash = Column(String(64), nullable=True)  # SHA-256 du payload
    previous_proof_hash = Column(String(64), nullable=True)  # chaîne de preuves
    
    # Vérification
    verification_status = Column(String(20), default="pending")  # pending, verified, disputed, rejected
    verification_method = Column(String(50), nullable=True)  # auto, manual, ai
    
    # Relations
    order = relationship("Order", back_populates="proofs")
```

### 2.2 Exigences de Preuve par Transition

| Transition | Preuves Requises | Acteur | Validation |
|------------|-----------------|--------|------------|
| `DRAFT → CONFIRMED` | Aucune (système) | System | Auto |
| `CONFIRMED → PICKUP_SCHEDULED` | Créneau horaire validé | System | Auto |
| `PICKUP_SCHEDULED → PICKUP_DRIVER_ASSIGNED` | Driver assigné atomic | System | Auto + SELECT FOR UPDATE |
| `PICKUP_DRIVER_ASSIGNED → PICKUP_IN_PROGRESS` | Driver a accepté la tâche | Driver | Auto |
| `PICKUP_IN_PROGRESS → PICKED_UP` | **PHOTO + GEOLOC + TIMESTAMP** | Driver | Auto + manuelle si doute |
| `PICKED_UP → RECEIVED_BY_PARTNER` | **PHOTO + SIGNATURE/STAMP** | Partner | Manuelle |
| `RECEIVED_BY_PARTNER → CLEANING_IN_PROGRESS` | Aucune | Partner | Auto |
| `CLEANING_IN_PROGRESS → QUALITY_CHECK` | Aucune | Partner | Auto |
| `QUALITY_CHECK → READY_FOR_DELIVERY` | **QC Checklist validée** | Partner | Auto + preuve photo si express |
| `READY_FOR_DELIVERY → DELIVERY_DRIVER_ASSIGNED` | Driver assigné atomic | System | Auto + SELECT FOR UPDATE |
| `DELIVERY_DRIVER_ASSIGNED → DELIVERY_IN_PROGRESS` | Driver a accepté | Driver | Auto |
| `DELIVERY_IN_PROGRESS → DELIVERED` | **PHOTO + GEOLOC + TIMESTAMP + SIGNATURE CLIENT** | Driver + Customer | Auto + manuelle si dispute |
| `DELIVERED → COMPLETED` | **Confirmation client ou délai d'opposition dépassé** | System/Customer | Auto (24h) |
| `* → FAILED` | **Raison documentée + photo si applicable** | Actor | Manuelle |
| `* → DISPUTED` | **Ticket de dispute créé** | Customer | Auto |

### 2.3 Timeline Immuable (OrderTimeline)

```python
class OrderTimeline(BaseModel):
    """Timeline immuable d'événements opérationnels"""
    __tablename__ = "order_timelines"

    id = Column(UUID, primary_key=True)
    order_id = Column(UUID, ForeignKey("orders.id"), nullable=False, index=True)
    
    # Événement
    event_type = Column(String(50), nullable=False)  # status_change, payment, proof_added, dispute, message
    event_subtype = Column(String(50), nullable=True)  # pickup_completed, payment_received, etc.
    
    # Données
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=True)
    payload = Column(JSONB, nullable=False)  # {proof_id, amount, actor_id, notes}
    
    # Horodatage
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Immutabilité
    event_hash = Column(String(64), nullable=False)  # SHA-256
    previous_event_hash = Column(String(64), nullable=True)  # chaîne cryptographique
    
    # Source
    source = Column(String(50), nullable=False)  # system, api, webhook, mobile, whatsapp
    correlation_id = Column(String(128), nullable=True)  # pour tracing distribué
    
    # Index composite
    __table_args__ = (
        Index('idx_timeline_order_occurred', 'order_id', 'occurred_at'),
    )
```

---

## 3. CORRIDOR TRUTH ENGINE — ARCHITECTURE

### 3.1 Composants

```
┌─────────────────────────────────────────────────────────────┐
│                    CORRIDOR TRUTH ENGINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Proof      │   │  Transition  │   │   Timeline   │    │
│  │  Validator   │◄──│   Enforcer   │◄──│   Recorder   │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Storage    │   │   Atomic     │   │   Chain      │    │
│  │   (S3/DB)    │   │   Locker     │   │   Builder    │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │  Consistency │   │   Dispute    │   │   Recon      │    │
│  │   Auditor    │   │  Resolver    │   │   Engine     │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Proof Validator

```python
class ProofValidator:
    """Valide qu'une preuve satisfait les exigences d'une transition"""
    
    REQUIREMENTS = {
        "PICKUP_IN_PROGRESS → PICKED_UP": {
            "proofs": [
                {"type": "photo", "min_count": 1, "max_age_seconds": 300},
                {"type": "geolocation", "max_distance_meters": 100, "max_age_seconds": 300},
            ],
            "actor": ["driver"],
            "auto_verify": True,
        },
        "DELIVERY_IN_PROGRESS → DELIVERED": {
            "proofs": [
                {"type": "photo", "min_count": 1, "max_age_seconds": 300},
                {"type": "geolocation", "max_distance_meters": 100, "max_age_seconds": 300},
                {"type": "signature", "required": False},  # optionnel si client absent
            ],
            "actor": ["driver"],
            "auto_verify": True,
            "escalation": {"no_signature": "notify_customer_for_confirmation"},
        },
        "QUALITY_CHECK → READY_FOR_DELIVERY": {
            "proofs": [
                {"type": "system", "check": "qc_checklist_passed"},
            ],
            "actor": ["partner"],
            "auto_verify": True,
        },
    }
    
    def validate(self, transition: str, proofs: List[OperationalProof]) -> ValidationResult:
        requirements = self.REQUIREMENTS.get(transition)
        if not requirements:
            return ValidationResult.ok()  # pas de preuves requises
        
        for req in requirements["proofs"]:
            matching = [p for p in proofs if p.proof_type == req["type"]]
            
            if req.get("required", True) and not matching:
                return ValidationResult.fail(f"Preuve manquante: {req['type']}")
            
            if req.get("min_count") and len(matching) < req["min_count"]:
                return ValidationResult.fail(f"Nombre insuffisant de preuves: {req['type']}")
            
            for proof in matching:
                age = (datetime.utcnow() - proof.recorded_at).total_seconds()
                if req.get("max_age_seconds") and age > req["max_age_seconds"]:
                    return ValidationResult.fail(f"Preuve trop ancienne: {req['type']}")
                
                if req.get("max_distance_meters"):
                    # Vérifier distance vs adresse prévue
                    distance = self._calculate_distance(proof, expected_address)
                    if distance > req["max_distance_meters"]:
                        return ValidationResult.fail(f"Distance excessive: {distance}m > {req['max_distance_meters']}m")
        
        return ValidationResult.ok()
```

### 3.3 Transition Enforcer (Atomic Locker)

```python
class TransitionEnforcer:
    """Force les transitions avec verrouillage et validation"""
    
    def enforce_transition(
        self,
        order_id: UUID,
        new_status: OrderStatus,
        actor_id: UUID,
        proofs: Optional[List[OperationalProof]] = None,
    ) -> TransitionResult:
        with self.db.begin_nested():
            # 1. VERROU : SELECT FOR UPDATE NOWAIT
            order = (
                self.db.query(Order)
                .filter(Order.id == order_id)
                .with_for_update(of=Order, nowait=True)
                .one()
            )
            
            # 2. VALIDATION : transition autorisée ?
            if not self._is_valid_transition(order.status, new_status):
                raise InvalidTransitionError(f"{order.status} → {new_status} interdit")
            
            # 3. VALIDATION : preuves suffisantes ?
            transition_key = f"{order.status.value} → {new_status.value}"
            proof_result = self.proof_validator.validate(transition_key, proofs or [])
            if not proof_result.is_valid:
                raise InsufficientProofError(proof_result.reason)
            
            # 4. VALIDATION : paiement cohérent ?
            if new_status == OrderStatus.CANCELLED:
                if order.payment_status in {PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID}:
                    raise InvalidTransitionError("Commande payée ne peut être annulée directement. Utiliser DISPUTED ou REFUNDED.")
            
            # 5. EXÉCUTION
            old_status = order.status
            order.status = new_status
            order.version += 1  # optimistic locking
            
            # 6. ENREGISTREMENT PREUVES
            for proof in proofs or []:
                proof.order_id = order_id
                proof.verified_at = datetime.utcnow()
                proof.verification_status = "verified"
                self.db.add(proof)
            
            # 7. TIMELINE
            timeline_event = OrderTimeline(
                order_id=order_id,
                event_type="status_change",
                from_status=old_status.value,
                to_status=new_status.value,
                payload={
                    "actor_id": str(actor_id),
                    "proof_ids": [str(p.id) for p in (proofs or [])],
                    "version": order.version,
                },
                occurred_at=datetime.utcnow(),
                event_hash=self._compute_event_hash(order_id, old_status, new_status, actor_id),
                previous_event_hash=self._get_last_event_hash(order_id),
                source="api",
            )
            self.db.add(timeline_event)
            
            # 8. STATUT HISTORY (legacy, pour compat)
            history = OrderStatusHistory(
                order_id=order_id,
                old_status=old_status.value,
                new_status=new_status.value,
                changed_by_user_id=actor_id,
            )
            self.db.add(history)
            
            return TransitionResult(
                order=order,
                timeline_event=timeline_event,
                proofs=proofs or [],
            )
```

---

## 4. MIGRATION DE LA BASE DE DONNÉES

### 4.1 Nouvelles Tables

```sql
-- Preuves opérationnelles
CREATE TABLE operational_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    proof_type VARCHAR(50) NOT NULL,
    proof_data JSONB NOT NULL DEFAULT '{}',
    actor_type VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    location_lat NUMERIC(10, 8),
    location_lng NUMERIC(11, 8),
    location_accuracy NUMERIC(5, 2),
    blockchain_hash VARCHAR(64),
    previous_proof_hash VARCHAR(64),
    verification_status VARCHAR(20) DEFAULT 'pending',
    verification_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_proof_type CHECK (proof_type IN ('photo', 'signature', 'geolocation', 'webhook', 'system', 'manual')),
    CONSTRAINT chk_actor_type CHECK (actor_type IN ('customer', 'driver', 'partner', 'system', 'admin')),
    CONSTRAINT chk_verification_status CHECK (verification_status IN ('pending', 'verified', 'disputed', 'rejected'))
);

CREATE INDEX idx_proofs_order ON operational_proofs(order_id);
CREATE INDEX idx_proofs_type ON operational_proofs(proof_type);
CREATE INDEX idx_proofs_verification ON operational_proofs(verification_status);

-- Timeline immuable
CREATE TABLE order_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_subtype VARCHAR(50),
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    payload JSONB NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_hash VARCHAR(64) NOT NULL,
    previous_event_hash VARCHAR(64),
    source VARCHAR(50) NOT NULL,
    correlation_id VARCHAR(128),
    
    CONSTRAINT chk_event_type CHECK (event_type IN ('status_change', 'payment', 'proof_added', 'dispute', 'message', 'refund', 'commission'))
);

CREATE INDEX idx_timeline_order_occurred ON order_timelines(order_id, occurred_at);
CREATE INDEX idx_timeline_event_type ON order_timelines(event_type);
CREATE INDEX idx_timeline_hash ON order_timelines(event_hash);

-- Ajout version pour optimistic locking sur orders
ALTER TABLE orders ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE INDEX idx_orders_version ON orders(id, version);

-- Contrainte unique pour éviter doublons de tâches logistiques
ALTER TABLE delivery_tasks ADD CONSTRAINT uniq_order_task_type UNIQUE (order_id, task_type);
```

### 4.2 Corrections Critiques

```sql
-- CORRECTION FLOAT → NUMERIC dans payment_intents
ALTER TABLE payment_intents 
    ALTER COLUMN amount TYPE NUMERIC(10, 2),
    ALTER COLUMN amount_expected TYPE NUMERIC(10, 2),
    ALTER COLUMN amount_paid TYPE NUMERIC(10, 2);

-- CORRECTION FLOAT → NUMERIC dans payment_transactions
ALTER TABLE payment_transactions 
    ALTER COLUMN amount TYPE NUMERIC(10, 2);

-- CORRECTION FLOAT → NUMERIC dans refund_transactions
ALTER TABLE refund_transactions 
    ALTER COLUMN amount TYPE NUMERIC(10, 2);

-- Contrainte anti-surpaye
ALTER TABLE payment_intents 
    ADD CONSTRAINT chk_amount_paid_lte_expected CHECK (amount_paid <= amount_expected);

-- Contrainte idempotence forte sur paiements
ALTER TABLE payment_intents 
    ADD CONSTRAINT uniq_active_intent_per_order 
    UNIQUE (order_id, status) 
    WHERE status NOT IN ('succeeded', 'failed', 'cancelled', 'expired');
```

---

## 5. API — NOUVEAUX ENDPOINTS

### 5.1 Preuves

```
POST /api/v1/orders/{order_id}/proofs
  Body: {
    "proof_type": "photo",
    "proof_data": {"url": "https://...", "hash": "sha256:..."},
    "location": {"lat": -4.325, "lng": 15.322, "accuracy": 5.0}
  }
  Response: { "proof_id": "...", "verification_status": "verified" }

GET /api/v1/orders/{order_id}/proofs
  Response: { "proofs": [...], "verified_count": 3 }

GET /api/v1/orders/{order_id}/timeline
  Response: { "events": [...], "chain_valid": true }
```

### 5.2 Transitions sécurisées

```
POST /api/v1/orders/{order_id}/transitions
  Body: {
    "new_status": "picked_up",
    "proof_ids": ["uuid-proof-1", "uuid-proof-2"]
  }
  Response: { 
    "order": {...}, 
    "transition": "pickup_in_progress → picked_up",
    "verified": true,
    "timeline_event_id": "..."
  }
  
  Error 409: { "error": "insufficient_proofs", "required": [...], "provided": [...] }
  Error 409: { "error": "invalid_transition", "from": "...", "to": "..." }
  Error 423: { "error": "concurrent_modification", "version": 5 }
```

---

## 6. FRONTEND — INTÉGRATION

### 6.1 Timeline Component

```tsx
// OrderTimeline.tsx
interface TimelineEvent {
  id: string;
  event_type: string;
  from_status?: string;
  to_status?: string;
  payload: {
    actor_name: string;
    proof_count: number;
    location?: { lat: number; lng: number };
  };
  occurred_at: string;
  event_hash: string;
}

const OrderTimeline: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { data: timeline } = useOrderTimeline(orderId);
  
  return (
    <div className="timeline">
      {timeline?.events.map((event, idx) => (
        <TimelineItem 
          key={event.id}
          event={event}
          isLast={idx === timeline.events.length - 1}
          chainValid={event.previous_event_hash === (timeline.events[idx-1]?.event_hash || null)}
        />
      ))}
    </div>
  );
};
```

### 6.2 Preuve Photo (Driver App / Web)

```tsx
// ProofCapture.tsx
const ProofCapture: React.FC<{
  orderId: string;
  proofType: 'photo' | 'signature';
  onCapture: (proof: ProofData) => void;
}> = ({ orderId, proofType, onCapture }) => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  
  const capture = async (file: File) => {
    // 1. Récupérer géoloc
    const pos = await getCurrentPosition({ enableHighAccuracy: true });
    setLocation(pos);
    
    // 2. Upload photo
    const upload = await uploadProofPhoto(orderId, file);
    
    // 3. Créer preuve
    const proof = await realApi.createProof(orderId, {
      proof_type: proofType,
      proof_data: { url: upload.url, hash: upload.hash },
      location: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      },
    });
    
    onCapture(proof);
  };
  
  return (
    <div>
      <CameraCapture onCapture={capture} />
      {location && (
        <LocationBadge 
          lat={location.coords.latitude} 
          lng={location.coords.longitude}
          accuracy={location.coords.accuracy}
        />
      )}
    </div>
  );
};
```

---

## 7. MÉTRIQUES & MONITORING

### 7.1 KPIs Truth Engine

| Métrique | Cible | Alerte |
|----------|-------|--------|
| Preuves validées / transitions | > 95% | < 90% |
| Temps moyen validation preuve | < 2s | > 5s |
| Disputes / commandes totales | < 1% | > 3% |
| Chaîne timeline corrompue | 0 | > 0 |
| Transitions sans preuve (forcées) | 0 | > 0 |

### 7.2 Dashboard Ops

```
┌─────────────────────────────────────────┐
│  OPERATIONAL TRUTH DASHBOARD           │
├─────────────────────────────────────────┤
│                                         │
│  Commandes actives: 47                  │
│  En attente de preuve: 3 ⚠️            │
│  Disputes actives: 1                    │
│  Chain integrity: ✅ 100%               │
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Preuves      │  │ Transitions  │    │
│  │ aujourd'hui  │  │ sans preuve  │    │
│  │ 128 ✅       │  │ 0 🔒          │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  Dernières alertes:                     │
│  • Driver #42: photo trop éloignée (340m)│
│  • Order #1291: transition forcée admin  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 8. ROADMAP D'IMPLÉMENTATION

### Phase 1 — Fondation (Semaine 1-2)
- [ ] Migration DB : tables `operational_proofs`, `order_timelines`
- [ ] Correction `Float` → `Numeric` dans payment
- [ ] Ajout colonne `version` sur `orders`
- [ ] Contrainte unique `delivery_tasks` (order_id, task_type)
- [ ] Service `ProofValidator` + `TransitionEnforcer`

### Phase 2 — Verrouillage (Semaine 3)
- [ ] `SELECT FOR UPDATE` sur toutes les transitions critiques
- [ ] Optimistic locking avec `version`
- [ ] Atomic driver assignment
- [ ] Tests de charge (race conditions)

### Phase 3 — Preuves (Semaine 4-5)
- [ ] Upload photo S3 (pre-signé)
- [ ] Capture géoloc + validation distance
- [ ] Composant `ProofCapture` (driver + partner)
- [ ] API `/proofs`, `/timeline`

### Phase 4 — Timeline (Semaine 6)
- [ ] Génération chaîne hash (SHA-256)
- [ ] Composant `OrderTimeline` frontend
- [ ] Export timeline (PDF pour disputes)
- [ ] Audit automatique de cohérence

### Phase 5 — Disputes & Reco (Semaine 7-8)
- [ ] Moteur de détection anomalies
- [ ] Auto-escalade si preuve manquante
- [ ] Dashboard Operational Truth
- [ ] Reconciliation payment ↔ order ↔ delivery

---

## 9. DÉCISIONS ARCHITECTURALES (ADR)

### ADR-001 : Preuve obligatoire = blocage transition
**Statut : Accepté**

Toute transition vers un statut nécessitant une preuve sera bloquée côté backend si la preuve est manquante. Aucune exception admin ne contournera cela sans audit trail.

### ADR-002 : Immutabilité timeline = pas de DELETE/UPDATE
**Statut : Accepté**

La table `order_timelines` n'aura jamais de UPDATE ni DELETE. Une erreur est corrigée par un nouvel événement ("correction"). Cela garantit l'audit trail.

### ADR-003 : Chaîne de hash = pas de blockchain externe
**Statut : Accepté**

Les hashes chaînées sont stockées en base, pas sur une blockchain publique. Cela suffit pour l'audit interne et évite la complexité/latence d'une blockchain.

---

*Document préparé pour Laundry Express RDC — v1.0*
*Statut : PRÊT POUR IMPLÉMENTATION*
