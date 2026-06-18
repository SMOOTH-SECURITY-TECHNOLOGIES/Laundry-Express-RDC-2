import React from 'react';
import { Icon } from '../Icon';
import { CARD, TYPO, SPACING } from '../ui/tokens';

/* ─── Types ─── */
interface GPSFallbackProps {
  /** Raison de l'indisponibilité GPS */
  reason?: 'unavailable' | 'permission' | 'timeout' | 'error';
  /** Dernière position connue */
  lastKnownPosition?: { lat: number; lng: number; time: string };
  /** Callback pour réessayer */
  onRetry?: () => void;
  /** Callback pour activer le fallback manuel */
  onUseFallback?: () => void;
}

/* ─── Config ─── */
const REASON_CONFIG: Record<string, { title: string; message: string; icon: string }> = {
  unavailable: {
    title: 'Géolocalisation indisponible',
    message: 'Votre appareil ne supporte pas la géolocalisation.',
    icon: 'mapPin',
  },
  permission: {
    title: 'Autorisation refusée',
    message: 'Autorisez l\'accès à la localisation dans les paramètres.',
    icon: 'shield',
  },
  timeout: {
    title: 'Délai dépassé',
    message: 'La géolocalisation prend trop de temps. Utilisation du fallback.',
    icon: 'clock',
  },
  error: {
    title: 'Erreur de géolocalisation',
    message: 'Une erreur est survenue. Utilisation des dernières positions connues.',
    icon: 'exclamation-circle',
  },
};

/* ─── Component ─── */
export const GPSFallback: React.FC<GPSFallbackProps> = ({
  reason = 'unavailable',
  lastKnownPosition,
  onRetry,
  onUseFallback,
}) => {
  const config = REASON_CONFIG[reason] || REASON_CONFIG.unavailable;

  return (
    <div className={`${CARD.base} overflow-hidden`}>
      {/* Header warning */}
      <div className="flex items-center gap-3 bg-orange-50 px-4 py-3 dark:bg-orange-950/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
          <Icon name={config.icon as any} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-orange-800 dark:text-orange-300">{config.title}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400">{config.message}</p>
        </div>
      </div>

      {/* Last known position */}
      {lastKnownPosition && (
        <div className={`${SPACING.cardPad}`}>
          <p className={TYPO.label}>Dernière position connue</p>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
            <Icon name="mapPin" className="h-4 w-4 text-content-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-content-primary">
                {lastKnownPosition.lat.toFixed(4)}, {lastKnownPosition.lng.toFixed(4)}
              </p>
              <p className="text-xs text-content-muted">Il y a {lastKnownPosition.time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback map visualization */}
      <div className="px-4 pb-4">
        <div className="relative h-[200px] overflow-hidden rounded-2xl border border-surface-border-subtle bg-surface-muted">
          {/* Grille de fallback */}
          <div className="absolute inset-0 opacity-30">
            <svg viewBox="0 0 400 200" className="h-full w-full">
              {/* Lignes horizontales */}
              {[50, 100, 150].map((y) => (
                <line key={`h-${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#94a3b8" strokeWidth="0.5" />
              ))}
              {/* Lignes verticales */}
              {[100, 200, 300].map((x) => (
                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="200" stroke="#94a3b8" strokeWidth="0.5" />
              ))}
            </svg>
          </div>

          {/* Position fallback */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                  <Icon name="mapPin" className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-orange-500" />
              </div>
              <div className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow dark:bg-slate-800 dark:text-slate-300">
                Position approximative
              </div>
            </div>
          </div>

          {/* Timestamp overlay */}
          <div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-500 shadow dark:bg-slate-800 dark:text-slate-400">
            Dernière synchro: {lastKnownPosition?.time || 'Inconnue'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`${SPACING.cardPad} pt-0 grid grid-cols-2 gap-2`}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-card text-sm font-bold text-content-primary transition active:scale-[0.97] hover:bg-surface-muted"
          >
            <Icon name="arrow-path" className="h-4 w-4" />
            Réessayer
          </button>
        )}
        {onUseFallback && (
          <button
            type="button"
            onClick={onUseFallback}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-bold text-white transition active:scale-[0.97] hover:bg-brand-blue-700"
          >
            <Icon name="map" className="h-4 w-4" />
            Utiliser fallback
          </button>
        )}
      </div>
    </div>
  );
};

export default GPSFallback;
