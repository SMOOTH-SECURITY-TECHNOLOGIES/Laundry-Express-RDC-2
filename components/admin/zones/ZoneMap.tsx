import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { Zone } from '../../../lib/admin/zones-types';

const W = 400; const H = 280;

export function ZoneMap({ zones, onSelectZone }: { zones: Zone[]; onSelectZone?: (z: Zone) => void }) {
  const [selected, setSelected] = useState<Zone | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const active = zones.filter((z) => z.status !== 'inactive');
  const wrap = fullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : '';

  const handleClick = (z: Zone) => {
    setSelected(z);
    onSelectZone?.(z);
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${wrap}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="map" className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Carte des zones — Kinshasa</h3>
        </div>
        <button type="button" onClick={() => setFullscreen((v) => !v)} className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded-lg bg-gray-50">{fullscreen ? 'Fermer' : 'Plein écran'}</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-gray-100">
        <rect width={W} height={H} fill="#f9f7f3" rx="8" />
        <polygon points="40,40 180,25 340,45 370,120 350,220 200,250 60,210 25,120" fill="#e8e4db" stroke="#d4cfc4" />
        {active.map((z) => (
          <g key={z.id} onClick={() => handleClick(z)} className="cursor-pointer">
            <circle cx={z.mapX} cy={z.mapY} r={selected?.id === z.id ? 22 : 18} fill={z.healthColor} opacity={selected?.id === z.id ? 0.5 : 0.25} />
            <circle cx={z.mapX} cy={z.mapY} r="8" fill={z.healthColor} stroke="#fff" strokeWidth="2" />
            <text x={z.mapX} y={z.mapY - 22} textAnchor="middle" fontSize="8" fontWeight="600" fill="#374151">{z.name}</text>
          </g>
        ))}
      </svg>
      {selected && (
        <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs">
          <p className="font-bold text-gray-900">{selected.name}</p>
          <p className="text-gray-600 mt-1">Volume: {selected.ordersPerDay} cmd/jour · SLA: {selected.slaPercent}% · Revenu: {selected.stats.revenuePerDay.toLocaleString('fr-FR')} $ · ETA: {selected.avgDeliveryMinutes} min</p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {[{ c: '#22C55E', l: 'Saine' }, { c: '#F59E0B', l: 'Attention' }, { c: '#EF4444', l: 'Saturation' }, { c: '#9CA3AF', l: 'Inactive' }].map((i) => (
          <div key={i.l} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i.c }} /><span className="text-[10px] text-gray-500">{i.l}</span></div>
        ))}
      </div>
      <ZonePerformancePanel zones={active.slice(0, 3)} />
    </div>
  );
}

function ZonePerformancePanel({ zones }: { zones: Zone[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
      {zones.map((z) => (
        <div key={z.id} className="rounded-xl bg-gray-50 px-3 py-2 text-center">
          <p className="text-xs font-semibold text-gray-700">{z.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{z.ordersPerDay} cmd/jour · {z.slaPercent}% SLA · {z.avgDeliveryMinutes} min ETA</p>
        </div>
      ))}
    </div>
  );
}
