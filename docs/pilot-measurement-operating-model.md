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
