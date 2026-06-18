import React from 'react';
import { Icon } from '../Icon';

interface DriverAvailabilityToggleProps {
  available: boolean;
  isUpdating: boolean;
  onToggle: () => void;
}

export const DriverAvailabilityToggle: React.FC<DriverAvailabilityToggleProps> = ({
  available,
  isUpdating,
  onToggle,
}) => (
  <section className="relative overflow-hidden rounded-2xl border border-surface-border-subtle bg-surface-card p-5 shadow-card">
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${available ? 'bg-green-500' : 'bg-slate-300'} ring-4 ${
              available ? 'ring-green-100' : 'ring-slate-100'
            }`}
          />
          <p className={`text-xl font-black ${available ? 'text-green-600' : 'text-slate-500'}`}>
            {available ? 'Disponible' : 'Indisponible'}
          </p>
        </div>
        <p className="mt-2 text-sm text-content-muted">
          {available ? 'Prêt pour de nouvelles missions.' : 'Hors ligne.'}
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={isUpdating}
        aria-label={available ? 'Passer indisponible' : 'Devenir disponible'}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition disabled:opacity-60 ${
          available
            ? 'bg-slate-800 text-white hover:bg-slate-700'
            : 'bg-brand-blue text-white hover:bg-brand-blue-700'
        }`}
      >
        {isUpdating ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Icon name={available ? 'xmark' : 'check'} className="h-5 w-5" />
        )}
      </button>
    </div>
  </section>
);

export default DriverAvailabilityToggle;
