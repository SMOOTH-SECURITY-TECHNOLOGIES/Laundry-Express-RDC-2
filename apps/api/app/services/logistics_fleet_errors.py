"""Typed errors for logistics fleet self-service boundaries."""


class FleetValidationError(ValueError):
    """Invalid input or business rule (HTTP 400)."""


class FleetAccessError(PermissionError):
    """Cross-tenant or privilege escalation attempt (HTTP 403)."""


class FleetNotFoundError(LookupError):
    """Resource hidden from tenant scope (HTTP 404)."""
