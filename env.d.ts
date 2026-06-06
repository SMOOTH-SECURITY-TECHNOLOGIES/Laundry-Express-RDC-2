/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_FEATURE_AI_SCANNING: string
  readonly VITE_FEATURE_REAL_TIME_TRACKING: string
  readonly VITE_FEATURE_MOBILE_PAYMENTS: string
  readonly VITE_FEATURE_WHATSAPP_NOTIFICATIONS: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_MPESA_CONSUMER_KEY: string
  readonly VITE_MPESA_CONSUMER_SECRET: string
  readonly VITE_AIRTEL_MONEY_API_KEY: string
  readonly VITE_ORANGE_MONEY_API_KEY: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_USE_REAL_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}