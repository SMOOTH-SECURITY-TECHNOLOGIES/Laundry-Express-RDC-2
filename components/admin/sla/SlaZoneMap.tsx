import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { SlaZonePerformance } from '../../../lib/admin/sla-types';

const W = 400; const H = 280;

export function SlaZoneMap({ zones }: { zones: SlaZonePerformance[] }) {
  const [selected, setSelected] = useState<SlaZonePerformance | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="map" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">SLA par zone (vue carte)</h3>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-gray-100">
        <rect width={W} height={H} fill="#f9f7f3" rx="8" />
        <polygon points="40,40 180,25 340,45 370,120 350,220 200,250 60,210 25,120" fill="#e8e4db" stroke="#d4cfc4" />
        {zones.map((z) => (
          <g key={z.id} onClick={() => setSelected(z)} className="cursor-pointer">
            <circle cx={z.mapX} cy={z.mapY} r={selected?.id === z.id ? 22 : 18} fill={z.healthColor} opacity={selected?.id === z.id ? 0.5 : 0.25} />
            <circle cx={z.mapX} cy={z.mapY} r="8" fill={z.healthColor} stroke="#fff" strokeWidth="2" />
            <text x={z.mapX} y={z.mapY - 22} textAnchor="middle" fontSize="8" fontWeight="600" fill="#374151">{z.name}</text>
          </g>
        ))}
      </svg>
      {selected && (
        <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs">
          <p className="font-bold text-gray-900">{selected.name}</p>
          <p className="text-gray-600 mt-1">SLA: {selected.slaPercent}% · ETA: {selected.etaMinutes} min · Volume: {selected.volume} · Incidents: {selected.incidents}</p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {[{ c: '#22C55E', l: '> 95%' }, { c: '#F59E0B', l: '90-95%' }, { c: '#EF4444', l: '< 90%' }].map((i) => (
          <div key={i.l} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i.c }} /><span className="text-[10px] text-gray-500">{i.l}</span></div>
        ))}
      </div>
    </div>
  );
}
