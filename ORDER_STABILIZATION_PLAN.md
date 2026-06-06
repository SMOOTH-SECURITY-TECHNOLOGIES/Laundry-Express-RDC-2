# PLAN DE STABILISATION DU SYSTÈME DE COMMANDE
## Laundry Express - CTO Mode Crise

**Date:** 18 mars 2026  
**Auteur:** Lead Backend Engineer + CTO  
**Objectif:** Stabiliser le système de commande pour qu'il soit fiable en production

---

## TÂCHE 1 — MATRICE DE DIVERGENCE

| Champ | Model | Schema | Service | DB (migration) | Status | Action |
|-------|-------|--------|---------|----------------|--------|--------|
| **Références** | | | | | | |
| `id` | UUID | UUID | UUID | UUID | ✅ OK | - |
| `order_number` | String(50) unique | str | généré | String(50) unique | ✅ OK | - |
| `customer_id` | UUID FK users | UUID | UUID | UUID FK users | ✅ OK | - |
| `partner_id` | UUID FK partners | UUID | UUID | UUID FK partners | ✅ OK | - |
| `pickup_address_id` | UUID FK customer_addresses | Optional[UUID] | Optional[UUID] | UUID FK customer_addresses | ✅ OK | - |
| `delivery_address_id` | UUID FK customer_addresses | Optional[UUID] | Optional[UUID] | UUID FK customer_addresses | ✅ OK | - |
| **Statuts** | | | | | | |
| `status` | String(50) | OrderStatus enum | OrderStatus enum | String(50) | ⚠️ DIVERGENCE | Model: String, Schema/Service: Enum |
| `payment_status` | String(20) | PaymentStatus enum | PaymentStatus enum | String(20) | ⚠️ DIVERGENCE | Model: String, Schema/Service: Enum |
| **Montants** | | | | | | |
| `currency` | String(3) | str (3 chars) | str | String(3) | ✅ OK | - |
| `subtotal_amount` | Float | float | Decimal | Float | ⚠️ DIVERGENCE | Types incohérents |
| `discount_amount` | Float | float | Decimal | Float | ⚠️ DIVERGENCE | Types incohérents |
| `pickup_fee` | Float | float | Decimal | Float | ⚠️ DIVERGENCE | Types incohérents |
| `delivery_fee` | Float | float | Decimal | Float | ⚠️ DIVERGENCE | Types incohérents |
| `total_amount` | Float | float | Decimal | Float | ⚠️ DIVERGENCE | Types incohérents |
| `amount_paid` | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ MANQUANT | Champ critique manquant |
| `refunded_amount` | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ MANQUANT | Champ critique manquant |
| **Instructions** | | | | | | |
| `special_instructions` | Text | Optional[str] | Optional[str] | Text | ✅ OK | - |
| **Dates et créneaux** | | | | | | |
| `pickup_date` | DateTime | Optional[datetime] | Optional[datetime] | DateTime | ✅ OK | - |
| `pickup_time_slot` | String(50) | Optional[str] | Optional[str] | String(50) | ✅ OK | - |
| `delivery_date` | DateTime | Optional[datetime] | Optional[datetime] | DateTime | ✅ OK | - |
| `delivery_time_slot` | String(50) | Optional[str] | Optional[str] | String(50) | ✅ OK | - |
| **Dates métier** | | | | | | |
| `confirmed_at` | DateTime | Optional[datetime] | datetime | DateTime | ⚠️ DIVERGENCE | Service utilise datetime.now() |
| `completed_at` | DateTime | Optional[datetime] | datetime | DateTime | ⚠️ DIVERGENCE | Service utilise datetime.now() |
| `cancelled_at` | DateTime | Optional[datetime] | datetime | DateTime | ⚠️ DIVERGENCE | Service utilise datetime.now() |
| **Champs fantômes** | | | | | | |
| `express` | ❌ ABSENT | ❌ ABSENT | ✅ PRÉSENT | ❌ ABSENT | ❌ FANTÔME | Utilisé dans service mais pas défini |
| `pickup_requested` | ❌ ABSENT | ❌ ABSENT | ✅ PRÉSENT | ❌ ABSENT | ❌ FANTÔME | Utilisé dans service mais pas défini |
| `delivery_requested` | ❌ ABSENT | ❌ ABSENT | ✅ PRÉSENT | ❌ ABSENT | ❌ FANTÔME | Utilisé dans service mais pas défini |
| `calculation_breakdown` | ❌ ABSENT | ❌ ABSENT | ✅ PRÉSENT | ❌ ABSENT | ❌ FANTÔME | Utilisé dans service mais pas défini |
| `actual_pickup_at` | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ SUPPRIMÉ | ❌ SUPPRIMÉ | Supprimé en migration |
| `actual_delivery_at` | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ SUPPRIMÉ | ❌ SUPPRIMÉ | Supprimé en migration |
| `scheduled_pickup_at` | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ SUPPRIMÉ | ❌ SUPPRIMÉ | Supprimé en migration |
| `scheduled_delivery_at` | ❌ ABSENT | ❌ ABSENT | ❌ ABSENT | ❌ SUPPRIMÉ | ❌ SUPPRIMÉ | Supprimé en migration |

### **ANALYSE DES DIVERGENCES CRITIQUES**

1. **Types de données monétaires incohérents** : Float (Model/DB) vs Decimal (Service) vs float (Schema)
2. **Champs de suivi de paiement manquants** : `amount_paid`, `refunded_amount` absents partout
3. **Champs fantômes dans le service** : `express`, `pickup_requested`, `delivery_requested`, `calculation_breakdown`
4. **Types d'énumération incohérents** : String en DB vs Enum dans le code
5. **Champs logistiques supprimés** : Tracking incomplet après migration

---

## TÂCHE 2 — MATRICE DE RISQUE

| Risque | Impact | Probabilité | Priorité | Correctif |
|--------|--------|-------------|----------|-----------|
| **Double création de commande** | Élevé (doublons, confusion) | Élevée (pas d'idempotence) | P0 | Ajouter `idempotency_key` + unique constraint |
| **Double paiement** | Élevé (perte financière) | Moyenne (pas de vérification) | P0 | Vérifier `payment_status` avant paiement |
| **Écriture partielle** | Élevé (données corrompues) | Moyenne (pas de transaction) | P0 | Transaction DB sur création commande |
| **Statut invalide** | Moyen (workflow cassé) | Élevée (pas de validation DB) | P1 | Enum DB + CHECK constraints |
| **Incohérence montant** | Élevé (erreurs financières) | Élevée (Float vs Decimal) | P1 | Float → Numeric(10,2) |
| **Transition concurrente** | Moyen (race condition) | Moyenne (pas de verrou) | P2 | Optimistic locking (version) |
| **Permissions non respectées** | Moyen (sécurité) | Élevée (logique incomplète) | P2 | Vérifications métier dans service |
| **Tracking logistique incomplet** | Faible (visibilité) | Élevée (champs supprimés) | P3 | Restaurer champs tracking |

### **PRIORISATION DES RISQUES**

1. **P0 - BLOQUANT** : Double création, double paiement, écriture partielle
2. **P1 - CRITIQUE** : Statut invalide, incohérence montant
3. **P2 - IMPORTANT** : Transition concurrente, permissions
4. **P3 - APRÈS STABILISATION** : Tracking logistique

---

## TÂCHE 3 — PLAN DE PATCH EXÉCUTABLE

### PATCH 0 — ALIGNEMENT MODÈLE/SCHEMA/SERVICE
**Objectif** : Éliminer les divergences entre les couches
**Problème corrigé** : Champs fantômes, types incohérents, enums vs strings
**Fichiers impactés** : `models/order.py`, `schemas/order.py`, `services/order_service.py`
**Actions précises** :
1. Ajouter champs manquants : `amount_paid`, `refunded_amount`, `express`, `pickup_requested`, `delivery_requested`
2. Harmoniser types : Float → Decimal partout
3. Convertir String → Enum dans model
4. Ajouter `calculation_breakdown` (JSON)
**Migration requise** : Oui - ajout colonnes, modification types
**Risques** : Migration lourde, impact données existantes

### PATCH 1 — TRANSACTION ATOMIQUE CRÉATION COMMANDE
**Objectif** : Garantir l'intégrité des données
**Problème corrigé** : Écriture partielle possible
**Fichiers impactés** : `services/order_service.py`, `repositories/order_repository.py`
**Actions précises** :
1. Encapsuler `create_order()` dans transaction DB
2. Rollback automatique en cas d'erreur
3. Vérifier contraintes avant commit
**Migration requise** : Non
**Risques** : Aucun (amélioration seulement)

### PATCH 2 — IDEMPOTENCE COMMANDE
**Objectif** : Empêcher les doublons
**Problème corrigé** : Double création de commande
**Fichiers impactés** : `models/order.py`, `schemas/order.py`, `services/order_service.py`, `api/routes/orders.py`
**Actions précises** :
1. Ajouter champ `idempotency_key` (String, unique)
2. Vérifier existence avant création
3. Retourner commande existante si clé dupliquée
**Migration requise** : Oui - ajout colonne `idempotency_key`
**Risques** : Cassure API (nouveau paramètre optionnel)

### PATCH 3 — FLOAT → NUMERIC
**Objectif** : Précision financière
**Problème corrigé** : Erreurs d'arrondi, incohérences
**Fichiers impactés** : `models/order.py`, `models/order_item.py`, migrations
**Actions précises** :
1. Remplacer Float → Numeric(10,2) dans models
2. Mettre à jour schémas pour utiliser Decimal
3. Créer migration de conversion
**Migration requise** : Oui - modification type colonnes
**Risques** : Perte de précision si conversion mal faite

### PATCH 4 — ENUM DB POUR STATUS
**Objectif** : Validation au niveau base
**Problème corrigé** : Statut invalide persisté
**Fichiers impactés** : `models/order.py`, migrations
**Actions précises** :
1. Créer type ENUM PostgreSQL pour OrderStatus
2. Créer type ENUM PostgreSQL pour PaymentStatus
3. Modifier colonnes pour utiliser ces types
4. Ajouter CHECK constraints
**Migration requise** : Oui - création types, modification colonnes
**Risques** : Migration complexe, downtime possible

### PATCH 5 — CONTRAINTES CHECK MINIMALES
**Objectif** : Intégrité métier en DB
**Problème corrigé** : Données invalides persistées
**Fichiers impactés** : `models/order.py`, migrations
**Actions précises** :
1. `total_amount >= 0`
2. `subtotal_amount >= 0`
3. `discount_amount >= 0`
4. `amount_paid >= 0`
5. `refunded_amount >= 0`
6. `amount_paid <= total_amount`
7. `refunded_amount <= amount_paid`
**Migration requise** : Oui - ajout contraintes
**Risques** : Rejet données existantes invalides

### PATCH 6 — PERMISSIONS MÉTIER DANS SERVICE
**Objectif** : Sécurité et contrôle d'accès
**Problème corrigé** : Permissions incomplètes
**Fichiers impactés** : `services/order_service.py`, `api/routes/orders.py`
**Actions précises** :
1. Implémenter vérification partenaire (`order.partner_id == user.partner_id`)
2. Implémenter vérification admin (`user.is_admin`)
3. Ajouter logique de transition autorisée par rôle
4. Vérifier propriété avant modifications
**Migration requise** : Non
**Risques** : Cassure fonctionnelle si permissions trop restrictives

### PATCH 7 — PAIEMENT IDEMPOTENT
**Objectif** : Éviter les doubles paiements
**Problème corrigé** : Double débit possible
**Fichiers impactés** : `services/payment_service.py`, `models/payment.py`
**Actions précises** :
1. Vérifier `payment_status` avant création intent
2. Ajouter `idempotency_key` sur PaymentIntent
3. Vérifier intent existant avec même clé
4. Transaction sur traitement paiement
**Migration requise** : Oui - ajout colonne `idempotency_key` sur payment_intents
**Risques** : Cassure API paiement

### PATCH 8 — CHAMPS LOGISTIQUES
**Objectif** : Tracking complet
**Problème corrigé** : Visibilité réduite
**Fichiers impactés** : `models/order.py`, `schemas/order.py`, migrations
**Actions précises** :
1. Restaurer `actual_pickup_at`, `actual_delivery_at`
2. Restaurer `scheduled_pickup_at`, `scheduled_delivery_at`
3. Ajouter `driver_id_pickup`, `driver_id_delivery`
4. Ajouter `pickup_notes`, `delivery_notes`
**Migration requise** : Oui - ajout colonnes
**Risques** : Données historiques perdues (supprimées)

---

## PRIORITÉS OBLIGATOIRES

### P0 — BLOQUANT
1. **PATCH 0** - Alignement modèle/schema/service
2. **PATCH 1** - Transaction atomique création commande  
3. **PATCH 2** - Idempotence commande

### P1 — CRITIQUE
4. **PATCH 3** - Float → Numeric
5. **PATCH 4** - Enum DB pour status
6. **PATCH 5** - Contraintes CHECK minimales

### P2 — IMPORTANT
7. **PATCH 6** - Permissions métier dans service
8. **PATCH 7** - Paiement idempotent

### P3 — APRÈS STABILISATION
9. **PATCH 8** - Champs logistiques

---

## CRITÈRE DE SUCCÈS

Le système est considéré stable si :

1. ✅ **Une commande ne peut pas être créée deux fois pour la même requête** (PATCH 2)
2. ✅ **Une commande ne peut pas être partiellement écrite** (PATCH 1)
3. ✅ **Un statut invalide ne peut pas être persisté** (PATCH 4 + PATCH 5)
4. ✅ **Les montants sont précis** (PATCH 3)
5. ✅ **Les transitions sont cohérentes** (PATCH 4 + PATCH 6)
6. ✅ **Le paiement ne peut pas être dupliqué** (PATCH 7)

---

## EXÉCUTION SÉQUENTIELLE

**Phase 1 (P0 - 48h)** : PATCH 0 → PATCH 1 → PATCH 2
**Phase 2 (P1 - 72h)** : PATCH 3 → PATCH 4 → PATCH 5  
**Phase 3 (P2 - 48h)** : PATCH 6 → PATCH 7
**Phase 4 (P3 - 24h)** : PATCH 8

**Total estimé** : 8 jours ouvrables

---

## VALIDATION

Chaque patch doit être validé par :
1. Tests unitaires mis à jour
2. Tests d'intégration
3. Migration testée sur base de staging
4. Revue de code par équipe

**Checklist de validation finale** :
- [ ] Aucune divergence modèle/schema/service
- [ ] Transaction rollback fonctionnel
- [ ] Idempotence testée avec requêtes dupliquées
- [ ] Montants précis à 0.01 près
- [ ] Statuts invalides rejetés par DB
- [ ] Paiements dupliqués détectés et bloqués
- [ ] Permissions respectées pour tous les rôles