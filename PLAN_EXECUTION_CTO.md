# PLAN D'EXÉCUTION ULTRA CONCRET - Laundry Express SRC 2

## 📋 ÉTAT ACTUEL RÉSUMÉ
- **Backend** : Architecture solide, tests d'intégration passés, routes API partiellement fonctionnelles
- **Frontend** : Structure complète, composants prêts, mais connecté à des mocks
- **Infrastructure** : Docker fonctionnel, DB stable, Redis opérationnel
- **Problème principal** : Chaîne frontend/backend non connectée, workflows E2E non validés

---

## 🎯 OBJECTIF FINAL
**Staging ready en 7 jours** avec :
1. API MVP stable et complète
2. Frontend connecté au backend réel
3. Tests E2E verts sur les workflows critiques
4. Environnement staging fonctionnel

---

## 📅 PLAN SUR 7 JOURS

### JOUR 1 : FIGER LE CONTRAT API MVP

#### Tâches Backend
1. **Lister les routes MVP obligatoires** :
   ```
   POST    /api/v1/auth/register
   POST    /api/v1/auth/login
   GET     /api/v1/auth/me
   POST    /api/v1/orders/estimate
   POST    /api/v1/orders
   GET     /api/v1/orders
   GET     /api/v1/orders/{id}
   POST    /api/v1/payments/intents
   POST    /api/v1/payments/intents/{id}/confirm-cash
   GET     /api/v1/payments/orders/{id}/summary
   POST    /api/v1/refunds/requests
   POST    /api/v1/disputes
   ```

2. **Tester chaque route critique** :
   ```bash
   # Script de validation des routes MVP
   cd apps/api && python -m pytest tests/integration/test_mvp_routes.py -v
   ```

3. **Corriger les 404/500 prioritaires** :
   - Vérifier les imports dans `app/main.py`
   - Corriger les dépendances manquantes
   - Ajouter les routes manquantes

#### Livrable Jour 1
- ✅ Liste des routes MVP figée
- ✅ Routes auth fonctionnelles (register/login/me)
- ✅ Script de test MVP créé

---

### JOUR 2 : CONNEXION AUTH FRONTEND/BACKEND

#### Tâches Frontend
1. **Configurer le service API réel** :
   - Activer `real-api.ts` dans `services/api.ts`
   - Configurer `VITE_API_BASE_URL` dans `.env.local`
   - Tester la connexion avec `checkBackendAvailability()`

2. **Brancher l'authentification** :
   - Modifier `context/AuthContext.tsx` pour utiliser l'API réelle
   - Remplacer les appels mock par `realApi.login()`, `realApi.register()`
   - Gérer le stockage du token JWT

3. **Brancher le profil utilisateur** :
   - Modifier `pages/ProfilePage.tsx` pour utiliser `realApi.getCurrentUser()`
   - Afficher les données réelles du backend

#### Tâches Backend
1. **Corriger les erreurs d'authentification** :
   - Vérifier la génération du token JWT
   - Corriger les validations de schéma
   - Tester avec Postman/curl

#### Livrable Jour 2
- ✅ Auth frontend connectée au backend
- ✅ Token JWT stocké et utilisé
- ✅ Profil utilisateur affiché avec données réelles

---

### JOUR 3 : COMMANDES ET PRICING

#### Tâches Frontend
1. **Brancher l'estimation de prix** :
   - Modifier `components/ServiceSelector.tsx` pour utiliser `realApi.estimateOrderPrice()`
   - Afficher les prix réels du backend

2. **Brancher la création de commande** :
   - Modifier `components/CreateTicketModal.tsx` pour utiliser `realApi.createOrder()`
   - Gérer la réponse avec l'ID de commande réel

3. **Brancher la liste des commandes** :
   - Modifier `pages/OrderPage.tsx` pour utiliser `realApi.getOrders()`
   - Afficher les commandes réelles du backend

4. **Brancher le détail de commande** :
   - Modifier `components/OrderSummary.tsx` pour utiliser `realApi.getOrder()`

#### Tâches Backend
1. **Corriger les routes orders** :
   - Vérifier `app/api/routes/orders.py`
   - Corriger les validations
   - Tester avec des données réelles

#### Livrable Jour 3
- ✅ Estimation de prix fonctionnelle
- ✅ Création de commande fonctionnelle
- ✅ Liste et détail des commandes affichés

---

### JOUR 4 : PAIEMENTS

#### Tâches Frontend
1. **Brancher la création d'intention de paiement** :
   - Modifier `components/PaymentModal.tsx` pour utiliser `realApi.createPaymentIntent()`
   - Gérer les différents modes de paiement

2. **Brancher la confirmation cash** :
   - Modifier `components/PaymentModal.tsx` pour utiliser `realApi.confirmCashPayment()`
   - Gérer la confirmation côté partenaire

3. **Brancher le résumé de paiement** :
   - Modifier `components/OrderSummary.tsx` pour utiliser `realApi.getOrderPaymentSummary()`
   - Afficher le statut de paiement réel

#### Tâches Backend
1. **Corriger les routes payments** :
   - Vérifier `app/api/routes/payments.py`
   - Corriger les calculs de montants
   - Tester les transitions d'état

#### Livrable Jour 4
- ✅ Intention de paiement créée
- ✅ Confirmation cash fonctionnelle
- ✅ Résumé de paiement affiché

---

### JOUR 5 : REMBOURSEMENTS ET LITIGES

#### Tâches Frontend
1. **Brancher la création de demande de remboursement** :
   - Modifier `components/modals/RefundRequestModal.tsx` pour utiliser `realApi.createRefundRequest()`
   - Gérer les raisons et montants

2. **Brancher la création de litige** :
   - Modifier les composants concernés pour utiliser `realApi.createDispute()`
   - Gérer les preuves et descriptions

3. **Brancher la liste des remboursements** :
   - Modifier les pages admin pour afficher les demandes réelles

#### Tâches Backend
1. **Corriger les routes refunds/disputes** :
   - Vérifier `app/api/routes/refunds.py` et `disputes.py`
   - Corriger les workflows d'approbation
   - Tester les permissions

#### Livrable Jour 5
- ✅ Demandes de remboursement fonctionnelles
- ✅ Litiges créés
- ✅ Interface admin pour la gestion

---

### JOUR 6 : TESTS E2E VERTS

#### Tâches Tests
1. **Créer les scénarios E2E critiques** :
   ```javascript
   // scripts/e2e-critical-flows.js
   Scénarios à valider :
   1. Register → Login → Get Profile
   2. Price Estimate → Create Order
   3. Order List → Order Detail
   4. Create Payment Intent → Confirm Cash
   5. Create Refund Request
   6. Create Dispute
   ```

2. **Exécuter et corriger les tests** :
   ```bash
   node scripts/e2e-critical-flows.js
   ```
   - Corriger chaque échec un par un
   - Documenter les corrections

3. **Automatiser la validation** :
   - Ajouter au CI/CD
   - Configurer les rapports
   - Définir les critères d'acceptation

#### Livrable Jour 6
- ✅ 6 scénarios E2E critiques passants
- ✅ Script d'automatisation fonctionnel
- ✅ Rapport de validation clair

---

### JOUR 7 : STAGING PROPRE ET VALIDATION

#### Tâches Staging
1. **Préparer l'environnement staging** :
   - Configurer les variables d'environnement staging
   - Vérifier les connexions DB/Redis
   - Configurer le logging structuré

2. **Test manuel complet** :
   - Parcours utilisateur complet
   - Parcours partenaire complet
   - Parcours admin complet
   - Test des edge cases

3. **Documentation finale** :
   - Guide de déploiement staging
   - Guide d'utilisation API
   - Checklist de validation

#### Livrable Jour 7
- ✅ Environnement staging opérationnel
- ✅ Tests manuels validés
- ✅ Documentation complète
- ✅ Rapport final CTO

---

## 🛠️ OUTILS ET COMMANDES

### Backend
```bash
# Tests
cd apps/api && python -m pytest tests/ -v

# Migrations
cd apps/api && alembic upgrade head

# Logs
docker compose logs api --tail=50

# Health check
curl http://localhost:18000/health
```

### Frontend
```bash
# Développement
npm run dev

# Build
npm run build

# Tests
npm test

# E2E
node scripts/validate-e2e.js
```

### Infrastructure
```bash
# Services
docker compose up -d
docker compose ps
docker compose logs -f

# DB
docker compose exec db psql -U laundry_user -d laundry_express
```

---

## 📊 CRITÈRES DE SUCCÈS

### Backend (Jour 1-5)
- [ ] Routes MVP 100% fonctionnelles
- [ ] Tests d'intégration 100% passants
- [ ] Documentation OpenAPI à jour
- [ ] Logs structurés opérationnels

### Frontend (Jour 2-5)
- [ ] 0 appel mock dans les workflows critiques
- [ ] 100% des composants connectés à l'API réelle
- [ ] Gestion d'erreur utilisateur friendly
- [ ] Loading states appropriés

### Tests E2E (Jour 6)
- [ ] 6 scénarios critiques 100% passants
- [ ] Temps d'exécution < 2 minutes
- [ ] Rapports clairs et actionnables
- [ ] Automatisation CI/CD prête

### Staging (Jour 7)
- [ ] Environnement accessible et stable
- [ ] Données de test réalistes
- [ ] Monitoring de base configuré
- [ ] Backup/restore testé

---

## 🚨 RISQUES ET MITIGATIONS

### Risque 1 : Routes API incomplètes
- **Mitigation** : Focus sur les routes MVP seulement, reporter les features secondaires

### Risque 2 : Problèmes de performance
- **Mitigation** : Optimisations basiques (index DB, cache Redis), scaling vertical si nécessaire

### Risque 3 : Bugs en production staging
- **Mitigation** : Feature flags, rollback rapide, monitoring agressif

### Risque 4 : Délais dépassés
- **Mitigation** : Priorisation stricte, journées de buffer intégrées

---

## 📞 SUPPORT ET ESCALATION

### Niveau 1 : Développeur
- Problèmes techniques mineurs
- Corrections de bugs
- Questions d'implémentation

### Niveau 2 : Lead Technique
- Blocages techniques majeurs
- Décisions d'architecture
- Priorisation des tâches

### Niveau 3 : CTO
- Problèmes business critiques
- Changements de scope
- Décisions stratégiques

---

## 🎉 LIVRABLES FINAUX

1. **Code** : Repository avec toutes les corrections
2. **Documentation** : Guides détaillés déploiement/utilisation
3. **Environnement** : Staging accessible et fonctionnel
4. **Rapport** : Analyse complète avec métriques
5. **Plan** : Roadmap pour la phase production

---

## 💡 RECOMMANDATIONS FINALES

1. **Focus** : Rester sur le MVP, éviter les features creep
2. **Qualité** : Tests avant features, validation rigoureuse
3. **Communication** : Daily standups, rapports transparents
4. **Flexibilité** : Adapter le plan aux découvertes terrain
5. **Célébration** : Reconnaître les milestones atteints

**Objectif** : Avoir un produit staging-ready qui démontre la valeur business et permet de collecter des feedbacks utilisateurs réels.