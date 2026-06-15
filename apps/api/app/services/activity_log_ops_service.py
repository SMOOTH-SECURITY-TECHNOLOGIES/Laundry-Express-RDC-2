import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.activity_log_ops import ActivityLogEvent

ACTOR_LABELS = {"admin": "Admin", "partner": "Partenaire", "driver": "Chauffeur", "client": "Client", "system": "Système"}
CORRIDOR_LABELS = {
    "order": "Commande", "payment": "Paiement", "logistics": "Logistique",
    "support": "Support", "marketing": "Marketing", "truth": "Vérité", "platform": "Plateforme",
}
SEVERITY_LABELS = {"critical": "Critique", "major": "Majeure", "medium": "Moyenne", "low": "Faible", "info": "Info"}
STATUS_LABELS = {"success": "Succès", "failed": "Échec", "pending": "En attente"}

ANOMALY_ACTIONS = {"delete_partner", "delete_payment", "admin_created", "permission_change", "mass_refund", "mass_cancel"}


class ActivityLogAnomalyEngine:
    @staticmethod
    def classify(action: str, resource_type: str, actor_type: str) -> tuple[str, bool]:
        key = f"{action}_{resource_type}".lower()
        if action in {"delete"} and resource_type in {"partner", "payment"}:
            return "critical", True
        if action in {"permission_change", "admin_created"}:
            return "critical", True
        if action in {"refund"} and resource_type == "payment":
            return "major", True
        if action in {"login"} and "unusual" in key:
            return "medium", True
        if action in ANOMALY_ACTIONS:
            return "major", True
        if action in {"create", "update", "payment", "delivery"}:
            return "low", False
        return "info", False


class ActivityLogOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(ActivityLogEvent).count() > 0:
            return
        now = datetime.now(timezone.utc)
        events: list[ActivityLogEvent] = []

        templates = [
            ("admin", "Jean Mukeba", "super_admin", "read", "Consultation du journal d'activité", "admin_activity_log", "platform", "ADM-DA21E9", "info", "success", "Faible"),
            ("admin", "Marie Manager", "admin", "update", "Commande mise à jour", "order", "order", "ORD-784512", "low", "success", "Suivi opérationnel"),
            ("admin", "Paul Finance", "admin", "payment", "Paiement confirmé", "payment", "payment", "PAY-442891", "low", "success", "Suivi opérationnel"),
            ("partner", "Pressing Gombe", "partner", "create", "Commande créée", "order", "order", "ORD-784513", "info", "success", "Suivi opérationnel"),
            ("driver", "Patrick Driver", "driver", "delivery", "Livraison effectuée", "delivery", "logistics", "DRV-99231", "low", "success", "Suivi opérationnel"),
            ("system", "Worker Cron", "system", "webhook", "Webhook traité", "webhook", "platform", "SYS-WH01", "info", "success", "Traçabilité"),
            ("admin", "Sophie Support", "admin", "update", "Ticket escaladé", "ticket", "support", "TKT-5512", "medium", "success", "Action requise"),
            ("admin", "Jean Mukeba", "super_admin", "validate", "Vérité opérationnelle validée", "truth_corridor", "truth", "TRUTH-881", "low", "success", "Traçabilité"),
            ("admin", "Paul Finance", "admin", "refund", "Remboursement traité", "payment", "payment", "PAY-REF-12", "major", "success", "Action requise"),
            ("client", "Client Kinshasa", "client", "create", "Nouvelle commande", "order", "order", "ORD-784514", "info", "success", "Suivi opérationnel"),
        ]

        for i, (actor_type, name, role, action, desc, resource, corridor, ref, sev, status, impact) in enumerate(templates):
            occurred = (now - timedelta(minutes=i * 7 + 3)).isoformat()
            sev_final, is_anom = ActivityLogAnomalyEngine.classify(action, resource, actor_type)
            if sev in {"major", "critical"}:
                sev_final, is_anom = sev, True
            events.append(ActivityLogEvent(
                event_id=ref,
                occurred_at=occurred,
                actor_type=actor_type,
                actor_name=name,
                actor_role=role,
                action=action,
                action_label=desc.split(".")[0],
                description=desc,
                resource_type=resource,
                resource_id=ref,
                reference=ref,
                corridor=corridor,
                severity=sev_final if isinstance(sev_final, str) else sev,
                status=status,
                impact=impact,
                ip_address="102.65.10.25" if actor_type == "admin" else "41.243.12.45",
                user_agent="Admin Dashboard - v2.4.1",
                device="MacBook Pro" if actor_type == "admin" else "Android",
                browser="Chrome 125",
                os_name="macOS",
                before_state={"status": "pending"} if action == "update" else None,
                after_state={"status": "paid"} if action == "payment" else {"status": "delivered"} if action == "delivery" else None,
                corridors_impacted=[corridor] if corridor != "platform" else ["order", "payment", "truth"],
                is_anomaly=is_anom,
            ))

        for hour in range(24):
            for day in range(7):
                if (hour + day) % 5 != 0:
                    continue
                ref = f"SYS-{uuid.uuid4().hex[:6].upper()}"
                events.append(ActivityLogEvent(
                    event_id=ref,
                    occurred_at=(now - timedelta(days=day, hours=hour)).isoformat(),
                    actor_type="system",
                    actor_name="Système",
                    actor_role="system",
                    action="worker",
                    action_label="Tâche automatique",
                    description="Worker planifié exécuté",
                    resource_type="worker",
                    reference=ref,
                    corridor="platform",
                    severity="info",
                    status="success",
                    impact="Traçabilité",
                    is_anomaly=False,
                ))

        self.db.add_all(events)
        self.db.commit()

    @staticmethod
    def actor_label(actor_type: str) -> str:
        return ACTOR_LABELS.get(actor_type, actor_type)

    @staticmethod
    def corridor_label(corridor: str) -> str:
        return CORRIDOR_LABELS.get(corridor, corridor)

    @staticmethod
    def severity_label(severity: str) -> str:
        return SEVERITY_LABELS.get(severity, severity)

    @staticmethod
    def status_label(status: str) -> str:
        return STATUS_LABELS.get(status, status)
