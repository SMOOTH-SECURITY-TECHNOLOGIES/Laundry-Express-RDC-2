import React from 'react';
import { Icon } from '../../components/Icon';

export const DispatchMap: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-content-primary flex items-center gap-2">
          <Icon name="map" className="w-5 h-5 text-brand-blue" />
          Carte de dispatch
        </h2>
      </div>
      <div className="relative h-64 w-full overflow-hidden rounded-xl bg-surface-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Icon name="mapPin" className="w-10 h-10 text-brand-blue mx-auto mb-2" />
            <p className="text-sm font-bold text-content-muted">Carte interactive</p>
            <p className="text-xs text-content-faint">Kinshasa, RDC</p>
          </div>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border-subtle bg-surface-card shadow-sm transition-colors hover:bg-surface-muted">
            <Icon name="plus" className="h-4 w-4 text-content-muted" />
          </button>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border-subtle bg-surface-card shadow-sm transition-colors hover:bg-surface-muted">
            <Icon name="minus" className="h-4 w-4 text-content-muted" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="flex items-center gap-1 rounded-lg border border-surface-border-subtle bg-surface-card px-2 py-1 text-xs font-bold text-content-muted shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-blue" /> 18 actifs
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-surface-border-subtle bg-surface-card px-2 py-1 text-xs font-bold text-content-muted shadow-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> 4 en attente
          </span>
        </div>
      </div>
    </div>
  );
};

export default DispatchMap;
