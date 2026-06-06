# Analyse d'alignement entre modèles, schémas et services

## 1. Problèmes critiques identifiés

### 1.1 Divergence entre `models/order.py` et `schemas/order.py`

**Problème :** Les champs utilisés dans le service `order_service.py` ne correspondent pas au modèle.

Dans `order_service.py` (ligne 45-48) :
```python
express = data.get("express", False)
pickup_requested = data.get("pickup_requested", False)
delivery_requested = data.get("delivery_requested", False)
calculation_breakdown = data.get("calculation_breakdown", {})
```

Mais dans `models/order.py`, ces champs sont **absents** :
- `express` ❌
- `pickup_requested` ❌  
- `delivery_requested` ❌
- `calculation_breakdown` ❌

**Impact :** Le service écrit sur des champs qui n'existent pas dans la base de données.

### 1.2 Types de données problématiques

**Problème 1 :** `Float` pour les montants financiers
```python
# Dans models/order.py
subtotal_amount = Column(Float, ...)
discount_amount = Column(Float, ...)
pickup_fee = Column(Float, ...)
delivery_fee = Column(Float, ...)
total_amount = Column(Float, ...)

# Dans schemas/order.py
subtotal_amount: float
discount_amount: float = 0
pickup_fee: float = 0
delivery_fee: float = 0
total_amount: float
```

**Impact :** Imprécision financière, erreurs d'arrondi.

**Problème 2 :** `String` pour les enums au lieu de types enum DB
```python
# Dans models/order.py
status = Column(String(50), default=OrderStatus.DRAFT, nullable=False)
payment_status = Column(String(20), default=PaymentStatus.PENDING, nullable=False)

# Dans schemas/order.py (correct)
status: OrderStatus
payment_status: PaymentStatus
```

**Impact :** Pas de validation au niveau DB, valeurs invalides possibles.

### 1.3 Champs opérationnels manquants

**Problème :** Le modèle ne contient pas les champs nécessaires pour le tracking logistique :
- `pickup_driver_id` ❌
- `delivery_driver_id` ❌
- `assigned_at` ❌
- `picked_up_at` ❌
- `received_by_partner_at` ❌
- `ready_for_delivery_at` ❌
- `delivered_at` ❌
- `failed_at` ❌

**Impact :** Impossible de tracker précisément le workflow logistique.

### 1.4 Pas de contraintes de cohérence métier

**Problème :** Aucune contrainte CHECK dans la DB :
- `total_amount >= 0` ❌
- `quantity > 0` ❌
- `unit_price >= 0` ❌
- Adresses requises si pickup/delivery demandé ❌

**Impact :** Données incohérentes possibles.

## 2. Analyse de `payment_service.py`

### Points forts :
- Architecture propre avec repositories
- Gestion des états de paiement
- Système de remboursements et litiges
- Calcul des commissions

### Problèmes identifiés :

**Problème 1 :** Utilisation de `float` pour les montants
```python
# Ligne 56-57
if abs(data.amount_expected - order.total_amount) > 0.01:
```

**Impact :** Comparaison flottante imprécise.

**Problème 2 :** Pas de gestion d'idempotence
- Pas de `idempotency_key` dans les transactions
- Risque de doubles paiements

**Problème 3 :** Simulation de paiement (MVP only)
```python
def _simulate_mobile_money_payment(self, intent: PaymentIntent, transaction: PaymentTransaction):
```

**Impact :** Pas prêt pour production.

## 3. Analyse de l'authentification

### Backend (`auth.py`) :
- ✅ Architecture REST propre
- ✅ Gestion JWT
- ✅ Refresh tokens
- ✅ Reset password

### Frontend (`AuthContext.tsx`) :
- ✅ Conversion API -> frontend user
- ✅ Gestion localStorage
- ✅ Tracking analytics

### Problème d'alignement :
**Dans `AuthContext.tsx` :**
```typescript
const convertApiUserToFrontendUser = (apiUser: ApiUser): User => {
  // Crée une adresse par défaut vide
  const defaultAddress: DrcAddress = {
    commune: '',
    avenue: '',
    numero: '',
  };
  // ...
}
```

**Problème :** L'adresse par défaut est vide, mais le schéma backend peut exiger des valeurs.

## 4. Problème d'écran blanc dans `App.tsx`

**Cause identifiée :** Logique conditionnelle problématique :
```typescript
// Ligne 267-269
if (currentPage === 'home' && !user) {
  return <LandingPage setCurrentPage={setCurrentPage} />;
}
```

**Problème :** Si `user` est `null` mais que `currentPage` n'est pas `'home'`, l'application peut crash.

**Solution potentielle :** Gérer mieux les états de chargement et les redirections.

## 5. Recommandations de correction

### Priorité 1 : Aligner les modèles et schémas

**Étape 1 :** Ajouter les champs manquants à `models/order.py` :
```python
express = Column(Boolean, default=False, nullable=False)
pickup_requested = Column(Boolean, default=False, nullable=False)
delivery_requested = Column(Boolean, default=False, nullable=False)
calculation_breakdown = Column(JSONB, nullable=True)  # Ou Text si JSONB pas supporté
```

**Étape 2 :** Créer une migration pour ajouter ces colonnes.

**Étape 3 :** Mettre à jour `schemas/order.py` pour inclure ces champs dans `OrderCreate`.

### Priorité 2 : Corriger les types de données

**Étape 1 :** Remplacer `Float` par `Numeric` :
```python
from sqlalchemy import Numeric

subtotal_amount = Column(Numeric(12, 2), default=0, nullable=False)
discount_amount = Column(Numeric(12, 2), default=0, nullable=False)
pickup_fee = Column(Numeric(12, 2), default=0, nullable=False)
delivery_fee = Column(Numeric(12, 2), default=0, nullable=False)
total_amount = Column(Numeric(12, 2), default=0, nullable=False)
```

**Étape 2 :** Utiliser les enums SQLAlchemy :
```python
from sqlalchemy import Enum as SqlEnum

status = Column(SqlEnum(OrderStatus), default=OrderStatus.DRAFT, nullable=False)
payment_status = Column(SqlEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
```

### Priorité 3 : Ajouter les champs opérationnels

**Étape 1 :** Ajouter les colonnes logistiques :
```python
pickup_driver_id = Column(UUID(as_uuid=True), ForeignKey('drivers.id'), nullable=True)
delivery_driver_id = Column(UUID(as_uuid=True), ForeignKey('drivers.id'), nullable=True)
assigned_at = Column(DateTime(timezone=True), nullable=True)
picked_up_at = Column(DateTime(timezone=True), nullable=True)
received_by_partner_at = Column(DateTime(timezone=True), nullable=True)
ready_for_delivery_at = Column(DateTime(timezone=True), nullable=True)
delivered_at = Column(DateTime(timezone=True), nullable=True)
failed_at = Column(DateTime(timezone=True), nullable=True)
```

### Priorité 4 : Ajouter les contraintes métier

**Étape 1 :** Ajouter des contraintes CHECK :
```python
from sqlalchemy import CheckConstraint

__table_args__ = (
    CheckConstraint('total_amount >= 0', name='check_total_amount_positive'),
    CheckConstraint('subtotal_amount >= 0', name='check_subtotal_amount_positive'),
    CheckConstraint('discount_amount >= 0', name='check_discount_amount_positive'),
    CheckConstraint('pickup_fee >= 0', name='check_pickup_fee_positive'),
    CheckConstraint('delivery_fee >= 0', name='check_delivery_fee_positive'),
)
```

### Priorité 5 : Gestion d'idempotence

**Étape 1 :** Ajouter `idempotency_key` :
```python
idempotency_key = Column(String(255), unique=True, nullable=True)
```

**Étape 2 :** Mettre à jour le service pour vérifier les clés d'idempotence.

## 6. Plan d'action immédiat

### Jour 1 : Corrections critiques
1. Créer une migration pour ajouter les champs manquants
2. Mettre à jour `order_service.py` pour utiliser les bons noms de champs
3. Tester la création de commande

### Jour 2 : Corrections de types
1. Créer une migration pour changer `Float` -> `Numeric`
2. Mettre à jour `payment_service.py` pour utiliser `Decimal`
3. Tester les calculs financiers

### Jour 3 : Améliorations métier
1. Ajouter les contraintes CHECK
2. Ajouter les champs logistiques
3. Tester le workflow complet

### Jour 4 : Authentification et frontend
1. Corriger la logique conditionnelle dans `App.tsx`
2. Tester les flux d'authentification
3. Vérifier la conversion API -> frontend

## 7. Conclusion

**État actuel :** Architecture solide mais avec des divergences critiques entre couches.

**Risque principal :** Le service écrit sur des champs qui n'existent pas dans la DB.

**Recommandation :** Commencer par aligner `models/order.py` avec ce que `order_service.py` utilise, puis corriger les types de données et ajouter les contraintes métier.

**Score d'alignement :** 6/10 (Problèmes critiques mais corrigeables)