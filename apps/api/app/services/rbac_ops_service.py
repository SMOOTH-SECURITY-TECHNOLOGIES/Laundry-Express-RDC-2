from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.rbac_ops import (
    RbacPermission,
    RbacPermissionAuditLog,
    RbacPermissionException,
    RbacPermissionHistory,
    RbacRiskAlert,
    RbacRole,
    RbacRolePermission,
    RbacSecurityPolicy,
    RbacTemporaryPermission,
    RbacTenant,
    RbacUserPermission,
    RbacUserRole,
)

MODULES = [
    "Dashboard", "Commandes", "Paiements", "Commissions", "Remboursements", "Revenue Leakage",
    "Promotions", "Publicités", "Fidélité", "Parrainage", "Campagnes", "Utilisateurs",
    "Support", "Avis", "Réclamations", "CMS", "Blog", "Notifications", "API", "Paramètres",
]

ACTIONS = ["view", "create", "update", "delete", "export", "validate", "approve"]

ROLE_LABELS = {
    "super_admin": "Super Admin", "admin": "Admin", "finance": "Finance", "support": "Support",
    "marketing": "Marketing", "partenaire": "Partenaire", "chauffeur": "Chauffeur", "moderateur": "Modérateur",
    "auditor": "Auditeur", "ops_manager": "Ops Manager", "tenant_admin": "Tenant Admin", "read_only": "Lecture seule",
}

ROLE_COLORS = {
    "super_admin": "#8B5CF6", "admin": "#3B82F6", "finance": "#22C55E", "support": "#F59E0B",
    "marketing": "#EC4899", "partenaire": "#06B6D4", "chauffeur": "#64748B", "moderateur": "#94A3B8",
    "auditor": "#A855F7", "ops_manager": "#0EA5E9", "tenant_admin": "#E11D48", "read_only": "#CBD5E1",
}

RISK_LABELS = {"low": "Faible", "medium": "Moyen", "high": "Élevé", "critical": "Critique"}
SEVERITY_LABELS = {"info": "Info", "warning": "Warning", "critical": "Critical"}
GRANT_LABELS = {"inherited": "Héritée", "custom": "Personnalisée", "temporary": "Temporaire"}

ROLE_MATRIX = {
    "super_admin": {m: "allowed" for m in MODULES},
    "admin": {m: "allowed" if m != "Paramètres" else "restricted" for m in MODULES},
    "finance": {m: "allowed" if m in {"Dashboard", "Commandes", "Paiements", "Commissions", "Remboursements", "Revenue Leakage"} else "forbidden" for m in MODULES},
    "support": {m: "allowed" if m in {"Dashboard", "Commandes", "Utilisateurs", "Support", "Avis", "Réclamations"} else "forbidden" for m in MODULES},
    "marketing": {m: "allowed" if m in {"Dashboard", "Promotions", "Publicités", "Campagnes", "Fidélité", "Parrainage"} else "forbidden" for m in MODULES},
    "partenaire": {m: "restricted" if m in {"Dashboard", "Commandes", "Paiements"} else "forbidden" for m in MODULES},
    "chauffeur": {m: "restricted" if m in {"Dashboard", "Commandes"} else "forbidden" for m in MODULES},
    "moderateur": {m: "allowed" if m in {"Dashboard", "Avis", "Réclamations", "CMS", "Blog"} else "forbidden" for m in MODULES},
}


def _module_slug(module: str) -> str:
    return module.lower().replace(" ", "_").replace("é", "e").replace("è", "e")


class RbacOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(RbacRole).count() > 0:
            return
        now = datetime.now(timezone.utc).isoformat()

        roles = [
            RbacRole(slug="super_admin", name="Super Admin", description="Accès total", user_count=4, permissions_count=164, created_at_label="Jan 2025", is_system=True),
            RbacRole(slug="admin", name="Admin", description="Gestion opérationnelle", user_count=18, permissions_count=120, created_at_label="Jan 2025", is_system=True),
            RbacRole(slug="finance", name="Finance", description="Paiements et revenus", user_count=12, permissions_count=48, created_at_label="Fév 2025", is_system=True),
            RbacRole(slug="support", name="Support", description="Tickets et utilisateurs", user_count=14, permissions_count=36, created_at_label="Fév 2025", is_system=True),
            RbacRole(slug="marketing", name="Marketing", description="Promotions et campagnes", user_count=10, permissions_count=32, created_at_label="Mar 2025", is_system=True),
            RbacRole(slug="partenaire", name="Partenaire", description="Accès limité partenaire", user_count=18, permissions_count=18, created_at_label="Mar 2025"),
            RbacRole(slug="chauffeur", name="Chauffeur", description="Accès logistique", user_count=16, permissions_count=12, created_at_label="Avr 2025"),
            RbacRole(slug="moderateur", name="Modérateur", description="Contrôle contenu", user_count=6, permissions_count=24, created_at_label="Avr 2025"),
            RbacRole(slug="auditor", name="Auditeur", description="Lecture audit et conformité", user_count=4, permissions_count=20, created_at_label="Mai 2025"),
            RbacRole(slug="ops_manager", name="Ops Manager", description="Opérations terrain", user_count=8, permissions_count=28, created_at_label="Mai 2025"),
            RbacRole(slug="tenant_admin", name="Tenant Admin", description="Administration tenant", user_count=3, permissions_count=40, created_at_label="Juin 2025"),
            RbacRole(slug="read_only", name="Lecture seule", description="Consultation uniquement", user_count=5, permissions_count=20, created_at_label="Juin 2025"),
        ]
        self.db.add_all(roles)

        permissions: list[RbacPermission] = []
        for module in MODULES:
            mod = _module_slug(module)
            for action in ACTIONS:
                risk = "critical" if action in {"delete", "approve"} and module in {"Paiements", "Paramètres", "API"} else (
                    "high" if action in {"export", "validate"} else "medium" if action in {"create", "update"} else "low"
                )
                permissions.append(RbacPermission(
                    slug=f"{mod}.{action}",
                    module=module,
                    action=action,
                    label=f"{module} — {action}",
                    description=f"Permission {action} sur {module}",
                    risk_level=risk,
                ))
        self.db.add_all(permissions)

        for role_slug, modules in ROLE_MATRIX.items():
            for module, level in modules.items():
                mod = _module_slug(module)
                if level == "forbidden":
                    continue
                for action in ACTIONS:
                    if level == "restricted" and action not in {"view", "update"}:
                        continue
                    self.db.add(RbacRolePermission(
                        role_slug=role_slug,
                        permission_slug=f"{mod}.{action}",
                        access_level=level,
                    ))

        users = [
            RbacUserRole(user_name="Jean Admin", user_email="jean.admin@laundry.cd", role_slug="super_admin", two_fa_enabled=True, last_login_at=now),
            RbacUserRole(user_name="Marie Manager", user_email="marie.manager@laundry.cd", role_slug="admin", two_fa_enabled=True, last_login_at=now),
            RbacUserRole(user_name="Paul Finance", user_email="paul.finance@laundry.cd", role_slug="finance", two_fa_enabled=False, last_login_at=now),
            RbacUserRole(user_name="Sophie Support", user_email="sophie.support@laundry.cd", role_slug="support", two_fa_enabled=True, last_login_at=now),
            RbacUserRole(user_name="Alice Marketing", user_email="alice.marketing@laundry.cd", role_slug="marketing", two_fa_enabled=False, last_login_at=now),
            RbacUserRole(user_name="David Partenaire", user_email="david.partner@laundry.cd", role_slug="partenaire", two_fa_enabled=False, last_login_at=now),
        ]
        self.db.add_all(users)

        self.db.add(RbacUserPermission(user_email="paul.finance@laundry.cd", permission_slug="revenue_leakage.export", grant_type="custom", access_level="allowed"))
        self.db.add(RbacPermissionException(user_email="paul.finance@laundry.cd", permission_slug="revenue.export", exception_type="grant", reason="Export finance exceptionnel"))
        self.db.add(RbacTemporaryPermission(user_email="paul.finance@laundry.cd", permission_slug="paiements.export", granted_by="Jean Admin", expires_at=now))

        self.db.add_all([
            RbacPermissionAuditLog(actor_name="Jean Admin", actor_email="jean.admin@laundry.cd", permission_slug="support.view", action="update", old_value="true", new_value="false", ip_address="41.243.12.45", occurred_at=now),
            RbacPermissionAuditLog(actor_name="Marie Manager", actor_email="marie.manager@laundry.cd", permission_slug="finance.export", action="grant", old_value="false", new_value="true", ip_address="41.243.12.88", occurred_at=now),
        ])

        self.db.add_all([
            RbacPermissionHistory(event_type="role_created", event_label="Création rôle", actor_name="Jean Admin", target="Auditeur", occurred_at=now),
            RbacPermissionHistory(event_type="permission_added", event_label="Permission ajoutée", actor_name="Marie Manager", target="revenue.export → Paul Finance", occurred_at=now),
            RbacPermissionHistory(event_type="user_exception", event_label="Exception utilisateur", actor_name="Jean Admin", target="paul.finance@laundry.cd", occurred_at=now),
        ])

        self.db.add_all([
            RbacRiskAlert(alert_type="no_2fa", title="Admin sans 2FA", severity="warning", user_email="paul.finance@laundry.cd"),
            RbacRiskAlert(alert_type="privilege_escalation", title="Privilège élevé récent", severity="critical", user_email="marie.manager@laundry.cd"),
            RbacRiskAlert(alert_type="mass_export", title="Export massif détecté", severity="warning", user_email="paul.finance@laundry.cd"),
        ])

        self.db.add_all([
            RbacSecurityPolicy(policy_key="mfa_required", policy_value="true", enabled=True),
            RbacSecurityPolicy(policy_key="session_rotation_days", policy_value="30", enabled=True),
            RbacSecurityPolicy(policy_key="ip_whitelist", policy_value="41.243.0.0/16", enabled=False),
            RbacSecurityPolicy(policy_key="geo_countries", policy_value="CD,FR,BE", enabled=True),
        ])

        self.db.add_all([
            RbacTenant(slug="tenant_a", name="Tenant A — Kinshasa", user_count=42, role_count=8),
            RbacTenant(slug="tenant_b", name="Tenant B — Lubumbashi", user_count=28, role_count=6),
            RbacTenant(slug="tenant_c", name="Tenant C — Goma", user_count=16, role_count=5),
        ])

        self.db.commit()

    @staticmethod
    def role_label(slug: str) -> str:
        return ROLE_LABELS.get(slug, slug)

    @staticmethod
    def risk_label(level: str) -> str:
        return RISK_LABELS.get(level, level)

    @staticmethod
    def severity_label(severity: str) -> str:
        return SEVERITY_LABELS.get(severity, severity)

    @staticmethod
    def grant_label(grant_type: str) -> str:
        return GRANT_LABELS.get(grant_type, grant_type)
