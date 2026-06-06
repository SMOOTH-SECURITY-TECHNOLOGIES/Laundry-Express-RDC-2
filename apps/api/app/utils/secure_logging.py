"""
Utilitaires de logging sécurisé.
Empêche l'exposition de données sensibles dans les logs.
"""

import logging
import re
from typing import Any, Dict, List, Optional
from datetime import datetime


class SecureFormatter(logging.Formatter):
    """Formatter qui masque les données sensibles dans les logs"""
    
    # Patterns pour les données sensibles
    SENSITIVE_PATTERNS = [
        # Tokens JWT
        (r'eyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}', '[JWT_TOKEN]'),
        
        # Emails
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]'),
        
        # Numéros de téléphone (format international)
        (r'\+\d{10,15}', '[PHONE]'),
        
        # Numéros de carte de crédit
        (r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CREDIT_CARD]'),
        
        # Codes secrets (6+ chiffres)
        (r'\b\d{6,}\b', '[SECRET_CODE]'),
        
        # UUIDs
        (r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '[UUID]'),
        
        # Passwords dans les logs (mot-clé "password" suivi de valeur)
        (r'(?i)(password|passwd|pwd)[=:]\s*["\']?[^"\'\s]+["\']?', '[PASSWORD]'),
        
        # Tokens d'authentification
        (r'(?i)(token|auth|bearer)[=:]\s*["\']?[^"\'\s]+["\']?', '[AUTH_TOKEN]'),
        
        # Clés API
        (r'(?i)(api[_-]?key|secret[_-]?key)[=:]\s*["\']?[^"\'\s]+["\']?', '[API_KEY]'),
    ]
    
    def format(self, record: logging.LogRecord) -> str:
        """Formate un enregistrement de log en masquant les données sensibles"""
        original_message = record.getMessage()
        sanitized_message = self._sanitize_message(original_message)
        
        # Crée une copie du record avec le message sanitized
        record_copy = logging.LogRecord(
            name=record.name,
            level=record.levelno,
            pathname=record.pathname,
            lineno=record.lineno,
            msg=sanitized_message,
            args=(),
            exc_info=record.exc_info
        )
        
        # Copie les autres attributs
        for attr in ['created', 'msecs', 'relativeCreated', 'thread', 'threadName',
                    'process', 'processName', 'exc_text', 'stack_info', 'funcName']:
            if hasattr(record, attr):
                setattr(record_copy, attr, getattr(record, attr))
        
        return super().format(record_copy)
    
    def _sanitize_message(self, message: str) -> str:
        """Sanitize un message en masquant les données sensibles"""
        if not message:
            return message
        
        sanitized = message
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized)
        
        return sanitized


def setup_secure_logging(
    level: int = logging.INFO,
    format_string: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    date_format: str = '%Y-%m-%d %H:%M:%S'
) -> None:
    """
    Configure le logging avec le formateur sécurisé.
    
    Args:
        level: Niveau de logging
        format_string: Format du message de log
        date_format: Format de la date
    """
    # Crée le formateur sécurisé
    formatter = SecureFormatter(format_string, date_format)
    
    # Configure le handler racine
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Supprime les handlers existants
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Ajoute un nouveau handler avec le formateur sécurisé
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)


def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize un dictionnaire en masquant les valeurs sensibles.
    
    Args:
        data: Dictionnaire à sanitizer
        
    Returns:
        Dictionnaire sanitized
    """
    if not data:
        return data
    
    sanitized = {}
    sensitive_keys = [
        'password', 'passwd', 'pwd', 'token', 'auth_token', 'refresh_token',
        'access_token', 'api_key', 'secret_key', 'credit_card', 'cvv',
        'ssn', 'social_security', 'phone', 'email', 'jwt', 'bearer'
    ]
    
    for key, value in data.items():
        key_lower = str(key).lower()
        
        # Vérifie si la clé est sensible
        is_sensitive = any(sensitive in key_lower for sensitive in sensitive_keys)
        
        if is_sensitive and value:
            # Masque la valeur
            if isinstance(value, str) and len(value) > 4:
                sanitized[key] = f"{value[:2]}...{value[-2:]}"
            else:
                sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            # Récursion pour les dictionnaires imbriqués
            sanitized[key] = sanitize_dict(value)
        elif isinstance(value, list):
            # Traite les listes
            sanitized[key] = [
                sanitize_dict(item) if isinstance(item, dict) else
                (f"{str(item)[:2]}...{str(item)[-2:]}" if is_sensitive and item else item)
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized


def log_sensitive_operation(
    logger: logging.Logger,
    operation: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None,
    level: int = logging.INFO
) -> None:
    """
    Log une opération sensible de manière sécurisée.
    
    Args:
        logger: Logger à utiliser
        operation: Nom de l'opération
        user_id: ID de l'utilisateur (optionnel)
        ip_address: Adresse IP (optionnel)
        additional_data: Données supplémentaires (optionnel)
        level: Niveau de log
    """
    log_data = {
        'operation': operation,
        'timestamp': datetime.utcnow().isoformat(),
    }
    
    if user_id:
        log_data['user_id'] = user_id
    
    if ip_address:
        log_data['ip_address'] = ip_address
    
    if additional_data:
        log_data['data'] = sanitize_dict(additional_data)
    
    message = f"Sensitive operation: {operation}"
    if user_id:
        message += f" (user: {user_id})"
    
    logger.log(level, message, extra={'secure_data': log_data})


# Exemple d'utilisation
if __name__ == "__main__":
    # Configuration
    setup_secure_logging()
    
    # Création d'un logger
    logger = logging.getLogger(__name__)
    
    # Test de logging sécurisé
    test_data = {
        'email': 'user@example.com',
        'password': 'SuperSecret123!',
        'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'phone': '+243810000000',
        'user': {
            'name': 'John Doe',
            'api_key': 'sk_test_1234567890abcdef'
        }
    }
    
    logger.info("Test message with sensitive data: %s", test_data)
    
    # Log d'opération sensible
    log_sensitive_operation(
        logger=logger,
        operation='user_login',
        user_id='123e4567-e89b-12d3-a456-426614174000',
        ip_address='192.168.1.100',
        additional_data=test_data
    )