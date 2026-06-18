/**
 * Pilot / controlled-production configuration.
 * Modules listed here are hidden from the admin Control Center unless VITE_APP_ENV=development.
 */

const appEnv = (import.meta.env.VITE_APP_ENV || 'development').toLowerCase();
const pilotMode =
  import.meta.env.VITE_PILOT_MODE === 'true' ||
  appEnv === 'pilot' ||
  appEnv === 'production' ||
  appEnv === 'staging';

/** Admin nav labels hidden during controlled transactional pilot. */
export const HIDDEN_ADMIN_MODULES: readonly string[] = [
  'Truth Dashboard',
  'Anomalies',
  'Investigate',
  'Analytics',
  'Revenue Leakage',
  'Campagnes',
  'Publicités',
  'Pages & CMS',
  'Blog',
  'Notifications',
  'Passerelles paiement',
  'WhatsApp',
  'SMS',
  'Email',
  'API & Webhooks',
  'Gestion Admin',
  'Permissions',
];

/** Visible only when pilot mode is active. */
export const PILOT_ONLY_ADMIN_MODULES: readonly string[] = ['Pilot Dashboard'];

export const pilotConfig = {
  isPilotMode: pilotMode,
  hiddenAdminModules: new Set(HIDDEN_ADMIN_MODULES),
  pilotOnlyModules: new Set(PILOT_ONLY_ADMIN_MODULES),
  paymentMode: (import.meta.env.VITE_PAYMENT_MODE || 'sandbox').toLowerCase(),
  paymentModeLabel:
    (import.meta.env.VITE_PAYMENT_MODE || 'sandbox').toLowerCase() === 'live'
      ? 'Paiement production'
      : 'Mode sandbox — aucun débit réel',
};

export function isAdminModuleVisible(label: string): boolean {
  if (pilotConfig.pilotOnlyModules.has(label)) {
    return pilotConfig.isPilotMode;
  }
  if (!pilotConfig.isPilotMode) return true;
  return !pilotConfig.hiddenAdminModules.has(label);
}
