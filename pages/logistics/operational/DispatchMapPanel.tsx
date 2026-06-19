import React from 'react';
import { logisticsCard } from '../logistics-ui';
import type { OperationalModel, NavigateHandler } from './useOperationalDashboard';

export const DispatchMapPanel: React.FC<{
  model: OperationalModel;
  driverPositions: Array<{ lat: number; lng: number }>;
  onNavigate?: NavigateHandler;
}> = ({ model, driverPositions, onNavigate }) => {
  const hasLivePositions = driverPositions.length > 0;
  const hasZoneFallback = model.mapZones.length > 0;

  return (
    <article className={`${logisticsCard} p-5`}>
      <h3 className="font-black text-content-primary">Carte dispatch</h3>
      <div className="relative mt-4 h-72 overflow-hidden rounded-2xl bg-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,.18)_1px,transparent_1px),linear-gradient(rgba(148,163,184,.18)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {!hasLivePositions && !hasZoneFallback ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-bold text-content-muted">
            Carte en attente des positions chauffeurs et des zones actives.
          </div>
        ) : (
          <>
            {!hasLivePositions && hasZoneFallback && (
              <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-xs font-bold text-content-primary shadow-sm">
                Fallback zones · GPS chauffeur indisponible
              </div>
            )}

            {driverPositions.slice(0, 12).map((point, index) => (
                <span
                  key={`${point.lat}-${point.lng}-${index}`}
                  className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-[10px] font-black text-white shadow-lg"
                  style={{
                    left: `${12 + ((index * 19 + point.lng * 100) % 72)}%`,
                    top: `${18 + ((index * 23 + point.lat * 100) % 58)}%`,
                  }}
                  title="Position chauffeur"
                >
                  ●
                </span>
              ))}
            {model.mapZones.slice(0, 6).map((zone, index) => (
              <button
                key={zone.zone}
                type="button"
                onClick={() => onNavigate?.('dispatch', { zone: zone.zone })}
                className={`absolute flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-black text-white shadow-md ring-4 ring-white/70 ${
                  zone.success >= 90 ? 'bg-green-500' : zone.success >= 70 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{
                  left: `${18 + (index * 13) % 66}%`,
                  top: `${26 + (index * 17) % 46}%`,
                }}
                title={`${zone.zone} · ${zone.missions} missions · ${zone.success}%`}
              >
                {zone.zone.slice(0, 2)}
              </button>
            ))}
          </>
        )}

        {(hasLivePositions || hasZoneFallback) && (
          <>
            <span className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-black text-brand-blue">
              {model.activeTasks.length} en cours
            </span>
            <span className="absolute bottom-4 left-28 rounded-full bg-white px-3 py-1 text-xs font-black text-orange-600">
              {model.openTasks.length} en attente
            </span>
          </>
        )}
      </div>
    </article>
  );
};
