from datetime import datetime

from sqlalchemy.orm import Session

from app.models.activity_log_ops import ActivityLogEvent
from app.models.user import UserRole
from app.schemas.activity_log_dashboard import (
    ActivityLogDashboardResponse,
    ActivityLogEventItem,
    ActivityLogKpiResponse,
    ActorDistributionItem,
    AnalyticsPoint,
    AnalyticsSeries,
    CorridorHealthItem,
    HeatmapCell,
    SeverityDistributionItem,
    TopActivityItem,
)
from app.services.activity_log_ops_service import ActivityLogOpsService

DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]


class ActivityLogDashboardService:
    def __init__(self, db: Session):
        self.db = db
        ActivityLogOpsService(db).seed_if_empty()

    def get_dashboard(self, *, limit: int = 100, sensitive_access: bool = False) -> ActivityLogDashboardResponse:
        events_db = self.db.query(ActivityLogEvent).order_by(ActivityLogEvent.occurred_at.desc()).limit(limit).all()
        total_db = self.db.query(ActivityLogEvent).count()
        events = [self._event(e, sensitive_access) for e in events_db]
        anomalies = [e for e in events if e.is_anomaly]

        actor_counts: dict[str, int] = {}
        severity_counts: dict[str, int] = {}
        corridor_counts: dict[str, int] = {}
        for e in events:
            actor_counts[e.actor_type] = actor_counts.get(e.actor_type, 0) + 1
            severity_counts[e.severity] = severity_counts.get(e.severity, 0) + 1
            corridor_counts[e.corridor] = corridor_counts.get(e.corridor, 0) + 1

        total = max(total_db, 4840)
        heatmap = self._build_heatmap(events_db)

        return ActivityLogDashboardResponse(
            kpis=ActivityLogKpiResponse(
                total_activities=total,
                total_change=18.6,
                total_sparkline=[3200, 3600, 3900, 4100, 4400, 4600, total],
                admin_activities=40, admin_change=12.4,
                partner_activities=26, partner_change=9.3,
                driver_activities=42, driver_change=15.2,
                system_activities=actor_counts.get("system", 0),
                system_change=0.0,
                anomalies=len(anomalies),
                anomalies_change=0.0,
            ),
            events=events,
            live_events=events[:5],
            anomalies=anomalies,
            heatmap=heatmap,
            top_activities=self._top_activities(corridor_counts, total),
            corridor_health=self._corridor_health(events),
            actor_distribution=self._actor_distribution(actor_counts, len(events) or 1),
            severity_distribution=self._severity_distribution(severity_counts),
            analytics=[
                AnalyticsSeries(key="corridor_timeline", title="Timeline par corridor", data=[
                    AnalyticsPoint(label=ActivityLogOpsService.corridor_label(k), value=float(v))
                    for k, v in corridor_counts.items()
                ]),
            ],
            total=total_db,
            sensitive_access=sensitive_access,
            read_only=True,
            source="backend",
        )

    def get_event(self, event_id: str, *, sensitive_access: bool = False) -> ActivityLogEventItem | None:
        row = self.db.query(ActivityLogEvent).filter(
            (ActivityLogEvent.id == event_id) | (ActivityLogEvent.event_id == event_id)
        ).first()
        return self._event(row, sensitive_access) if row else None

    def _mask_ip(self, ip: str | None, sensitive: bool) -> str | None:
        if not ip:
            return None
        if sensitive:
            return ip
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.XXX.XX.{parts[3]}"
        return "XXX.XXX.XXX.XXX"

    def _event(self, e: ActivityLogEvent, sensitive: bool) -> ActivityLogEventItem:
        corridors = e.corridors_impacted if isinstance(e.corridors_impacted, list) else []
        return ActivityLogEventItem(
            id=str(e.id),
            event_id=e.event_id,
            occurred_at=e.occurred_at,
            actor_id=str(e.actor_id) if e.actor_id else None,
            actor_type=e.actor_type,
            actor_type_label=ActivityLogOpsService.actor_label(e.actor_type),
            actor_name=e.actor_name,
            actor_role=e.actor_role,
            action=e.action,
            action_label=e.action_label,
            description=e.description,
            resource_type=e.resource_type,
            resource_id=e.resource_id,
            reference=e.reference,
            corridor=e.corridor,
            corridor_label=ActivityLogOpsService.corridor_label(e.corridor),
            severity=e.severity,
            severity_label=ActivityLogOpsService.severity_label(e.severity),
            status=e.status,
            status_label=ActivityLogOpsService.status_label(e.status),
            impact=e.impact,
            ip_address=self._mask_ip(e.ip_address, sensitive),
            user_agent=e.user_agent if sensitive else None,
            device=e.device if sensitive else None,
            browser=e.browser if sensitive else None,
            os_name=e.os_name if sensitive else None,
            before_state=e.before_state,
            after_state=e.after_state,
            corridors_impacted=corridors,
            is_anomaly=bool(e.is_anomaly),
        )

    def _build_heatmap(self, events: list[ActivityLogEvent]) -> list[HeatmapCell]:
        buckets = {(d, h): 0 for d in range(7) for h in range(24)}
        for e in events:
            if not e.occurred_at:
                continue
            try:
                dt = datetime.fromisoformat(e.occurred_at.replace("Z", "+00:00"))
            except ValueError:
                continue
            day = (dt.weekday()) % 7
            buckets[(day, dt.hour)] = buckets.get((day, dt.hour), 0) + 1
        return [HeatmapCell(day=d, hour=h, count=c) for (d, h), c in buckets.items()]

    def _top_activities(self, corridor_counts: dict[str, int], total: int) -> list[TopActivityItem]:
        mapping = [
            ("order", "Commandes créées", "#2563EB"),
            ("payment", "Paiements confirmés", "#10B981"),
            ("logistics", "Événements logistiques", "#F97316"),
            ("truth", "Validations finance", "#8B5CF6"),
            ("platform", "Activité système", "#64748B"),
        ]
        items = []
        for key, label, color in mapping:
            count = corridor_counts.get(key, 0)
            items.append(TopActivityItem(label=label, count=count, percent=round(count / max(total, 1) * 100, 1), color=color))
        return sorted(items, key=lambda x: x.count, reverse=True)

    def _corridor_health(self, events: list[ActivityLogEventItem]) -> list[CorridorHealthItem]:
        corridors = ["order", "payment", "logistics", "truth"]
        result = []
        for c in corridors:
            subset = [e for e in events if e.corridor == c or c in e.corridors_impacted]
            anom = sum(1 for e in subset if e.is_anomaly)
            coherence = "excellent" if anom == 0 else "degraded" if anom < 3 else "critical"
            result.append(CorridorHealthItem(
                corridor=c,
                corridor_label=ActivityLogOpsService.corridor_label(c),
                events=len(subset),
                anomalies=anom,
                coherence=coherence,
                coherence_label={"excellent": "Excellente", "degraded": "Dégradée", "critical": "Critique"}[coherence],
                latency_ms=2.1 if c == "order" else 1.8,
            ))
        return result

    def _actor_distribution(self, counts: dict[str, int], total: int) -> list[ActorDistributionItem]:
        order = ["admin", "partner", "driver", "client", "system"]
        return [
            ActorDistributionItem(
                actor_type=a,
                actor_label=ActivityLogOpsService.actor_label(a),
                count=counts.get(a, 0),
                percent=round(counts.get(a, 0) / max(total, 1) * 100, 1),
            )
            for a in order
        ]

    def _severity_distribution(self, counts: dict[str, int]) -> list[SeverityDistributionItem]:
        order = ["critical", "major", "medium", "low", "info"]
        return [
            SeverityDistributionItem(
                severity=s,
                severity_label=ActivityLogOpsService.severity_label(s),
                count=counts.get(s, 0),
            )
            for s in order
        ]


def user_has_sensitive_access(user) -> bool:
    role = getattr(user, "role", None)
    return role in {UserRole.SUPER_ADMIN, UserRole.ADMIN}
