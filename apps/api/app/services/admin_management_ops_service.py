from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.admin_management_ops import (
    AdminMgmtActivityLog,
    AdminMgmtAuditLog,
    AdminMgmtInvitation,
    AdminMgmtPermission,
    AdminMgmtRole,
    AdminMgmtRolePermission,
    AdminMgmtSecurityAlert,
    AdminMgmtSession,
    AdminMgmtUser,
)

ROLE_LABELS = {
    "super_admin": "Super Admin", "admin": "Admin", "finance": "Finance",
    "support": "Support", "marketing": "Marketing", "operations": "Operations", "moderator": "Modérateur",
}
STATUS_LABELS = {"active": "Actif", "suspended": "Suspendu", "inactive": "Inactif", "pending": "En attente"}
ROLE_COLORS = {
    "super_admin": "#8B5CF6", "admin": "#3B82F6", "finance": "#22C55E", "support": "#F59E0B",
    "marketing": "#EC4899", "operations": "#06B6D4", "moderator": "#94A3B8",
}
RESOURCES = ["Utilisateurs", "Commandes", "Paiements", "Finance", "Support", "Promotions", "Campagnes", "Partenaires", "Paramètres", "API"]
ROLE_MATRIX = {
    "super_admin": {r: {"view": True, "create": True, "update": True, "delete": True, "export": True} for r in RESOURCES},
    "admin": {r: {"view": True, "create": True, "update": True, "delete": False, "export": True} for r in RESOURCES},
    "finance": {"Utilisateurs": {"view": True}, "Commandes": {"view": True}, "Paiements": {"view": True, "export": True}, "Finance": {"view": True, "create": True, "update": True, "export": True}},
    "support": {"Utilisateurs": {"view": True, "update": True}, "Commandes": {"view": True, "update": True}, "Support": {"view": True, "create": True, "update": True}},
    "marketing": {"Promotions": {"view": True, "create": True, "update": True}, "Campagnes": {"view": True, "create": True, "update": True, "export": True}},
    "operations": {"Commandes": {"view": True, "update": True}, "Partenaires": {"view": True, "update": True}},
    "moderator": {"Utilisateurs": {"view": True}, "Support": {"view": True, "update": True}},
}


class AdminManagementOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(AdminMgmtUser).count() > 0:
            return
        now = datetime.now(timezone.utc).isoformat()

        roles = [
            AdminMgmtRole(slug="super_admin", name="Super Admin", description="Accès complet plateforme", user_count=4, permissions_count=50, created_at_label="Jan 2025"),
            AdminMgmtRole(slug="admin", name="Admin", description="Administration générale", user_count=8, permissions_count=38, created_at_label="Jan 2025"),
            AdminMgmtRole(slug="finance", name="Finance", description="Finance et paiements", user_count=3, permissions_count=18, created_at_label="Fév 2025"),
            AdminMgmtRole(slug="support", name="Support", description="Support client", user_count=4, permissions_count=14, created_at_label="Fév 2025"),
            AdminMgmtRole(slug="marketing", name="Marketing", description="Campagnes et promotions", user_count=2, permissions_count=12, created_at_label="Mar 2025"),
            AdminMgmtRole(slug="operations", name="Operations", description="Opérations terrain", user_count=2, permissions_count=10, created_at_label="Mar 2025"),
            AdminMgmtRole(slug="moderator", name="Modérateur", description="Modération contenu", user_count=1, permissions_count=6, created_at_label="Avr 2025"),
        ]
        self.db.add_all(roles)

        admins = [
            AdminMgmtUser(name="Jean Admin", email="jean.admin@laundry.cd", phone="+243 900 111 001", role_slug="super_admin", status="active", two_fa_enabled=True, last_login_at=now),
            AdminMgmtUser(name="Marie Manager", email="marie.manager@laundry.cd", phone="+243 900 111 002", role_slug="admin", status="active", two_fa_enabled=True, last_login_at=now),
            AdminMgmtUser(name="Paul Finance", email="paul.finance@laundry.cd", phone="+243 900 111 003", role_slug="finance", status="active", two_fa_enabled=False, last_login_at=now),
            AdminMgmtUser(name="Sophie Support", email="sophie.support@laundry.cd", phone="+243 900 111 004", role_slug="support", status="active", two_fa_enabled=True, last_login_at=now),
            AdminMgmtUser(name="Alice Marketing", email="alice.marketing@laundry.cd", phone="+243 900 111 005", role_slug="marketing", status="active", two_fa_enabled=False, last_login_at=now),
            AdminMgmtUser(name="David Ops", email="david.ops@laundry.cd", phone="+243 900 111 006", role_slug="operations", status="inactive", two_fa_enabled=False, last_login_at=now),
        ]
        self.db.add_all(admins)

        for role_slug, resources in ROLE_MATRIX.items():
            for resource, perms in resources.items():
                for action, granted in perms.items():
                    if granted:
                        self.db.add(AdminMgmtRolePermission(
                            role_slug=role_slug,
                            permission_slug=f"{resource.lower()}.{action}",
                            granted=True,
                        ))

        self.db.add_all([
            AdminMgmtInvitation(email="new.admin@laundry.cd", role_slug="admin", invited_by="Jean Admin", status="pending", expires_at=now),
            AdminMgmtInvitation(email="finance2@laundry.cd", role_slug="finance", invited_by="Marie Manager", status="pending", expires_at=now),
            AdminMgmtInvitation(email="support2@laundry.cd", role_slug="support", invited_by="Jean Admin", status="pending", expires_at=now),
        ])

        self.db.add_all([
            AdminMgmtSession(user_name="Jean Admin", user_email="jean.admin@laundry.cd", ip_address="41.243.12.45", city="Kinshasa", device="MacBook Pro", browser="Chrome 125", is_active=True, last_seen_at=now),
            AdminMgmtSession(user_name="Marie Manager", user_email="marie.manager@laundry.cd", ip_address="41.243.12.88", city="Kinshasa", device="Windows 11", browser="Edge 124", is_active=True, last_seen_at=now),
            AdminMgmtSession(user_name="Sophie Support", user_email="sophie.support@laundry.cd", ip_address="197.155.44.12", city="Lubumbashi", device="iPhone 15", browser="Safari", is_active=True, last_seen_at=now),
        ])

        self.db.add_all([
            AdminMgmtActivityLog(actor_name="Jean Admin", action="login", action_label="Connexion réussie", target="Panel admin", ip_address="41.243.12.45", result="success", occurred_at=now),
            AdminMgmtActivityLog(actor_name="Marie Manager", action="permission_change", action_label="Modification de permissions", target="Paul Finance → Finance", ip_address="41.243.12.88", result="success", occurred_at=now),
            AdminMgmtActivityLog(actor_name="Jean Admin", action="invite", action_label="Invitation envoyée", target="new.admin@laundry.cd", ip_address="41.243.12.45", result="success", occurred_at=now),
            AdminMgmtActivityLog(actor_name="System", action="login_failed", action_label="Échec de connexion", target="unknown@bad.com", ip_address="203.0.113.42", result="failed", occurred_at=now),
        ])

        self.db.add(AdminMgmtAuditLog(
            actor_name="Marie Manager", resource_type="admin_user", resource_id="paul-finance",
            old_state={"role": "support"}, new_state={"role": "finance"}, occurred_at=now,
        ))

        self.db.add_all([
            AdminMgmtSecurityAlert(alert_type="unusual_country", title="Connexion pays inhabituel", severity="warning", count=1),
            AdminMgmtSecurityAlert(alert_type="login_failures", title="10 échecs login", severity="critical", count=1),
            AdminMgmtSecurityAlert(alert_type="privilege_escalation", title="Escalade privilège détectée", severity="critical", count=1),
        ])
        self.db.commit()

    @staticmethod
    def role_label(slug: str) -> str:
        return ROLE_LABELS.get(slug, slug)

    @staticmethod
    def status_label(s: str) -> str:
        return STATUS_LABELS.get(s, s)
