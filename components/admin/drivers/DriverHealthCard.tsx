import React from 'react';
import { Icon } from '../../Icon';
import type { DriverHealthOverview } from '../../../lib/admin/drivers-types';

const SEGMENTS = [
  { key: 'availablePercent' as const, label: 'Disponible', color: '#22c55e' },
  { key: 'busyPercent' as const, label: 'Occupé', color: '#3b82f6' },
  { key: 'pausePercent' as const, label: 'Pause', color: '#f97316' },
  { key: 'offlinePercent' as const, label: 'Hors ligne', color: '#9ca3af' },
  { key: 'suspendedPercent' as const, label: 'Suspendu', color: '#ef4444' },
];

export function DriverHealthCard({ health }: { health: DriverHealthOverview }) {
  const r = 50; const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="heart" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Santé du réseau</h3>
      </div>
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
            {SEGMENTS.map((seg) => {
              const pct = health[seg.key];
              const dash = (pct / 100) * circ;
              const el = (
                <circle key={seg.label} cx="60" cy="60" r={r} fill="none" stroke={seg.color} strokeWidth="14"
                  strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} strokeLinecap="round" />
              );
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-gray-900">{health.availablePercent}%</span>
            <span className="text-[10px] text-gray-500">Disponible</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {SEGMENTS.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600">{seg.label} {health[seg.key]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
