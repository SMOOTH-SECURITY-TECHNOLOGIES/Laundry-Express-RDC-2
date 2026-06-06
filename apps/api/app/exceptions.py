"""Exceptions personnalisées pour l'application"""

from typing import Optional, Any


class AppException(Exception):
    """Exception de base pour l'application"""
    
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Optional[Any] = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)


# ========== VALIDATION ERRORS ==========

class ValidationError(AppException):
    """Erreur de validation des données"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "VALIDATION_ERROR", details)


class InvalidInputError(ValidationError):
    """Erreur d'entrée invalide"""
    pass


class MissingRequiredFieldError(ValidationError):
    """Champ requis manquant"""
    pass


class InvalidFormatError(ValidationError):
    """Format invalide"""
    pass


# ========== AUTHENTICATION & AUTHORIZATION ERRORS ==========

class AuthenticationError(AppException):
    """Erreur d'authentification"""
    
    def __init__(self, message: str = "Authentification requise", details: Optional[Any] = None):
        super().__init__(message, "AUTHENTICATION_ERROR", details)


class AuthorizationError(AppException):
    """Erreur d'autorisation"""
    
    def __init__(self, message: str = "Accès non autorisé", details: Optional[Any] = None):
        super().__init__(message, "AUTHORIZATION_ERROR", details)


class InvalidTokenError(AuthenticationError):
    """Token invalide"""
    pass


class ExpiredTokenError(AuthenticationError):
    """Token expiré"""
    pass


class InsufficientPermissionsError(AuthorizationError):
    """Permissions insuffisantes"""
    pass


# ========== RESOURCE ERRORS ==========

class ResourceNotFoundError(AppException):
    """Ressource non trouvée"""
    
    def __init__(self, resource_type: str, resource_id: Any, details: Optional[Any] = None):
        message = f"{resource_type} avec ID {resource_id} non trouvé"
        super().__init__(message, "RESOURCE_NOT_FOUND", details)
        self.resource_type = resource_type
        self.resource_id = resource_id


class ResourceAlreadyExistsError(AppException):
    """Ressource déjà existante"""
    
    def __init__(self, resource_type: str, identifier: Any, details: Optional[Any] = None):
        message = f"{resource_type} avec identifiant {identifier} existe déjà"
        super().__init__(message, "RESOURCE_ALREADY_EXISTS", details)
        self.resource_type = resource_type
        self.identifier = identifier


class ResourceConflictError(AppException):
    """Conflit de ressources"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "RESOURCE_CONFLICT", details)


# ========== PAYMENT ERRORS ==========

class PaymentError(AppException):
    """Erreur de paiement"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "PAYMENT_ERROR", details)


class PaymentIntentNotFoundError(ResourceNotFoundError):
    """Intention de paiement non trouvée"""
    
    def __init__(self, payment_intent_id: Any, details: Optional[Any] = None):
        super().__init__("Intention de paiement", payment_intent_id, details)


class OrderNotFoundError(ResourceNotFoundError):
    """Commande non trouvée"""
    
    def __init__(self, order_id: Any, details: Optional[Any] = None):
        super().__init__("Commande", order_id, details)


class UserNotFoundError(ResourceNotFoundError):
    """Utilisateur non trouvé"""
    
    def __init__(self, user_id: Any, details: Optional[Any] = None):
        super().__init__("Utilisateur", user_id, details)


class InvalidPaymentAmountError(PaymentError):
    """Montant de paiement invalide"""
    pass


class PaymentAlreadyCompletedError(PaymentError):
    """Paiement déjà complété"""
    pass


class PaymentProviderError(PaymentError):
    """Erreur du fournisseur de paiement"""
    pass


# ========== REFUND ERRORS ==========

class RefundError(AppException):
    """Erreur de remboursement"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "REFUND_ERROR", details)


class RefundRequestNotFoundError(ResourceNotFoundError):
    """Demande de remboursement non trouvée"""
    
    def __init__(self, refund_request_id: Any, details: Optional[Any] = None):
        super().__init__("Demande de remboursement", refund_request_id, details)


class InvalidRefundAmountError(RefundError):
    """Montant de remboursement invalide"""
    pass


class RefundAlreadyProcessedError(RefundError):
    """Remboursement déjà traité"""
    pass


# ========== DISPUTE ERRORS ==========

class DisputeError(AppException):
    """Erreur de litige"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "DISPUTE_ERROR", details)


class DisputeNotFoundError(ResourceNotFoundError):
    """Litige non trouvé"""
    
    def __init__(self, dispute_id: Any, details: Optional[Any] = None):
        super().__init__("Litige", dispute_id, details)


class DisputeAlreadyResolvedError(DisputeError):
    """Litige déjà résolu"""
    pass


# ========== COMMISSION ERRORS ==========

class CommissionError(AppException):
    """Erreur de commission"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "COMMISSION_ERROR", details)


class CommissionNotFoundError(ResourceNotFoundError):
    """Commission non trouvée"""
    
    def __init__(self, commission_id: Any, details: Optional[Any] = None):
        super().__init__("Commission", commission_id, details)


class CommissionAlreadySettledError(CommissionError):
    """Commission déjà réglée"""
    pass


# ========== DATABASE ERRORS ==========

class DatabaseError(AppException):
    """Erreur de base de données"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "DATABASE_ERROR", details)


class ConstraintViolationError(DatabaseError):
    """Violation de contrainte"""
    pass


class ConnectionError(DatabaseError):
    """Erreur de connexion"""
    pass


# ========== EXTERNAL SERVICE ERRORS ==========

class ExternalServiceError(AppException):
    """Erreur de service externe"""
    
    def __init__(self, service_name: str, message: str, details: Optional[Any] = None):
        full_message = f"Erreur du service {service_name}: {message}"
        super().__init__(full_message, "EXTERNAL_SERVICE_ERROR", details)
        self.service_name = service_name


class ServiceUnavailableError(ExternalServiceError):
    """Service indisponible"""
    pass


class RateLimitExceededError(ExternalServiceError):
    """Limite de taux dépassée"""
    pass


# ========== BUSINESS LOGIC ERRORS ==========

class BusinessLogicError(AppException):
    """Erreur de logique métier"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "BUSINESS_LOGIC_ERROR", details)


class InvalidStateError(BusinessLogicError):
    """État invalide pour l'opération"""
    pass


class OperationNotAllowedError(BusinessLogicError):
    """Opération non autorisée"""
    pass


# ========== CONFIGURATION ERRORS ==========

class ConfigurationError(AppException):
    """Erreur de configuration"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, "CONFIGURATION_ERROR", details)


class MissingConfigurationError(ConfigurationError):
    """Configuration manquante"""
    pass


class InvalidConfigurationError(ConfigurationError):
    """Configuration invalide"""
    pass


# ========== UTILITY FUNCTIONS ==========

def handle_exception(exception: Exception) -> AppException:
    """Convertir une exception standard en AppException"""
    if isinstance(exception, AppException):
        return exception
    
    # Convertir les exceptions SQLAlchemy courantes
    try:
        from sqlalchemy.exc import SQLAlchemyError
        if isinstance(exception, SQLAlchemyError):
            return DatabaseError(
                message="Erreur de base de données",
                details=str(exception)
            )
    except ImportError:
        pass
    
    # Retourner une exception générique
    return AppException(
        message=str(exception) or "Une erreur inattendue s'est produite",
        code="INTERNAL_ERROR",
        details={"original_exception": type(exception).__name__}
    )