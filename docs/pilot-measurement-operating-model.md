# Pilot Measurement Operating Model

## Risk Shift

The main pilot risk is no longer only whether the product works.

The main pilot risk is whether customers, partners and drivers use it as expected.

Automated tests can prove corridors, contracts and regressions. They cannot prove market behavior.

## Freeze Policy

During the pilot:

- freeze new product features;
- freeze new AI workflows;
- freeze new operational workflows;
- keep instrumentation open.

Allowed pilot changes:

- logs;
- analytics events;
- measurement dashboards;
- internal metrics;
- tracking corrections.

Rejected pilot changes:

- new customer features;
- new partner workflows;
- new AI modules;
- cosmetic dashboard expansion without a pilot metric target.

Decision rule:

```text
Which pilot metric does this change improve?
```

If nobody can answer precisely, reject the change during the pilot.

## Five Pilot Questions

1. Do customers complete the first order?
2. Do customers come back?
3. Do partners earn more money?
4. Do drivers become the bottleneck?
5. Does the marketplace create liquidity?

## Pilot Dashboard KPIs

The pilot dashboard should stay intentionally small.

Track these 10 KPIs:

- Nouveaux clients
- Premieres commandes
- Taux de completion
- Temps attribution
- Temps collecte
- Temps livraison
- Reclamations
- Taux de reachat
- Revenu plateforme
- Revenu partenaires

## KPI Decision Thresholds

Each KPI must return one pilot decision state:

- GO: continue the pilot corridor.
- WATCH: keep instrumentation open and investigate the weak signal.
- STOP: pause feature expansion and fix the operating corridor before scaling.

| KPI | GO | WATCH | STOP | Action |
| --- | --- | --- | --- | --- |
| Nouveaux clients | >= 10 nouveaux clients | 3-9 nouveaux clients | < 3 nouveaux clients | STOP: revoir acquisition terrain et canaux. WATCH: renforcer activation locale. GO: continuer le pilote. |
| Premieres commandes | >= 8 premieres commandes | 3-7 premieres commandes | < 3 premieres commandes | STOP: simplifier onboarding et offre premiere commande. WATCH: observer les abandons. GO: maintenir. |
| Taux de completion | > 70% | 50-70% | < 50% | STOP: arreter les ajouts produit et corriger le corridor commande-paiement-livraison. WATCH: auditer les abandons. GO: continuer. |
| Temps attribution | <= 30 min | 31-60 min | > 60 min ou n/a | STOP: reduire zone, ajouter partenaires disponibles ou revoir dispatch. WATCH: suivre refus/reassignations. GO: maintenir. |
| Temps collecte | <= 45 min | 46-90 min | > 90 min ou n/a | STOP: limiter volumes ou renforcer chauffeurs. WATCH: optimiser zones et horaires. GO: maintenir. |
| Temps livraison | <= 60 min | 61-120 min | > 120 min ou n/a | STOP: traiter le goulot livraison avant croissance. WATCH: surveiller SLA. GO: maintenir. |
| Reclamations | <= 5% des commandes | 5-12% des commandes | > 12% des commandes | STOP: corriger qualite/service avant acquisition. WATCH: classifier causes. GO: maintenir. |
| Taux de reachat | >= 25% | 10-24% | < 10% | STOP: revoir experience, prix et relance post-commande. WATCH: lancer reactivation mesuree. GO: augmenter retention. |
| Revenu plateforme | >= 100 $ | 1-99 $ | 0 $ | STOP: verifier paiement, commission et pricing. WATCH: suivre marge. GO: continuer. |
| Revenu partenaires | >= 500 $ | 1-499 $ | 0 $ | STOP: verifier demande et economie partenaire. WATCH: interviewer partenaires. GO: continuer. |

## Success Signal

The pilot is healthy when:

- first order completion improves;
- repeat order rate improves;
- partner revenue grows;
- attribution time decreases;
- pickup and delivery times stay controlled;
- claims stay low.

## Verdict

Laundry Express should be treated as an economic experiment during the pilot, not only as a software project. The most important validation now comes from real customers, partners and drivers using the system.
