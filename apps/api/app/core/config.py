from typing import List, Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Laundry Express RDC"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    API_PORT: int = 8000
    FRONTEND_PORT: int = 5173
    
    # Security
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    POSTGRES_DB: str = "laundry_express"
    POSTGRES_USER: str = "laundry_user"
    POSTGRES_PASSWORD: str = "laundry_pass"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    
    # Database URLs
    DATABASE_URL: str = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    DATABASE_URL_SYNC: str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    
    # URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    API_BASE_URL: str = "http://localhost:8000/api/v1"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:3003,http://127.0.0.1:3004,http://localhost:3003,http://localhost:3004"
    CORS_ALLOW_CREDENTIALS: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into list"""
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Allowed hosts
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,0.0.0.0"
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Parse ALLOWED_HOSTS string into list"""
        if not self.ALLOWED_HOSTS:
            return []
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]
    
    # Email
    SMTP_HOST: str = "mailpit"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@laundryexpress.cd"
    SMTP_FROM_NAME: str = "Laundry Express RDC"
    EMAIL_BACKEND: str = "smtp"
    
    # AI Integration
    GEMINI_API_KEY: Optional[str] = None
    
    # Payment Providers
    MPESA_CONSUMER_KEY: Optional[str] = None
    MPESA_CONSUMER_SECRET: Optional[str] = None
    MPESA_SHORTCODE: Optional[str] = None
    MPESA_PASSKEY: Optional[str] = None
    
    AIRTEL_MONEY_API_KEY: Optional[str] = None
    AIRTEL_MONEY_API_SECRET: Optional[str] = None
    
    ORANGE_MONEY_API_KEY: Optional[str] = None
    ORANGE_MONEY_API_SECRET: Optional[str] = None
    
    # File Storage
    STORAGE_TYPE: str = "local"
    LOCAL_STORAGE_PATH: str = "./storage"
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None
    S3_REGION: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    SENTRY_DSN: Optional[str] = None
    
    # Feature Flags
    FEATURE_AI_SCANNING: bool = True
    FEATURE_REAL_TIME_TRACKING: bool = True
    FEATURE_MOBILE_PAYMENTS: bool = True
    FEATURE_WHATSAPP_NOTIFICATIONS: bool = False
    
    # Admin
    ADMIN_EMAIL: str = "admin@laundryexpress.cd"
    ADMIN_PASSWORD: Optional[str] = None
    SUPER_ADMIN_EMAILS: List[str] = ["admin@laundryexpress.cd"]
    
    # Worker
    WORKER_CONCURRENCY: int = 4
    WORKER_MAX_TASKS_PER_CHILD: int = 1000
    WORKER_BROKER_URL: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    WORKER_RESULT_BACKEND: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/1"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60
    
    # Cache
    CACHE_DEFAULT_TIMEOUT: int = 300
    CACHE_KEY_PREFIX: str = "laundry_"
    
    # Monitoring
    HEALTH_CHECK_ENABLED: bool = True
    METRICS_ENABLED: bool = True
    PROMETHEUS_ENABLED: bool = False
    
    # Development
    DROP_DATABASE_ON_STARTUP: bool = False

    @model_validator(mode="after")
    def validate_security_settings(self):
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be provided explicitly")

        if not self.ADMIN_PASSWORD:
            raise ValueError("ADMIN_PASSWORD must be provided explicitly")

        return self
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
