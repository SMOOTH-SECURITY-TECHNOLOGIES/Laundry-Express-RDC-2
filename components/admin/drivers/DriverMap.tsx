import React, { useMemo, useState } from 'react';
import { Icon } from '../../Icon';
import type { DriverMapPoint, DriverStatus } from '../../../lib/admin/drivers-types';

const COLORS: Record<DriverStatus, string> = {
  available: '#22c55e', on_mission: '#3b82f6', pause: '#f97316', offline: '#9ca3af', suspended: '#ef4444',
};

const W = 400; const H = 280;

function toSvg(lat: number, lng: number) {
  const x = ((lng - 15.22) / 0.18) * (W - 60) + 30;
  const y = ((-4.25 - lat) / 0.15) * (H - 50) + 25;
  return { x, y };
}

export function DriverMap({ points }: { points: DriverMapPoint[] }) {
  const [fullscreen, setFullscreen] = useState(false);
  const mapped = useMemo(() => points.map((p) => ({ ...p, ...toSvg(p.lat, p.lng) })), [points]);
  const wrap = fullscreen ? 'fixed inset-0 z-50 bg-white p-6' : 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4';

  return (
    <div className={wrap}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="map" className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Localisation chauffeurs</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
          </span>
        </div>
        <button type="button" onClick={() => setFullscreen((v) => !v)} className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded-lg bg-gray-50">
          {fullscreen ? 'Fermer' : 'Plein écran'}
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-gray-100">
        <rect width={W} height={H} fill="#f9f7f3" rx="8" />
        <polygon points="40,40 180,25 340,45 370,120 350,220 200,250 60,210 25,120" fill="#e8e4db" stroke="#d4cfc4" />
        {['Gombe', 'Limete', 'Ngaliema', 'Masina', 'Bandalungwa', 'Kalamu'].map((name, i) => (
          <text key={name} x={80 + i * 45} y={30 + (i % 2) * 15} fontSize="7" fill="#9ca3af" fontWeight="600">{name}</text>
        ))}
        {mapped.map((p) => p.clusterCount ? (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="16" fill={COLORS[p.status]} opacity="0.85" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{p.clusterCount}</text>
          </g>
        ) : (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="8" fill={COLORS[p.status]} opacity="0.25" />
            <circle cx={p.x} cy={p.y} r="4" fill={COLORS[p.status]} stroke="#fff" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {[{ c: COLORS.available, l: 'Disponible' }, { c: COLORS.on_mission, l: 'En mission' }, { c: COLORS.pause, l: 'Pause' }, { c: COLORS.suspended, l: 'Incident' }].map((i) => (
          <div key={i.l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: i.c }} /><span className="text-[10px] text-gray-500">{i.l}</span></div>
        ))}
      </div>
    </div>
  );
}
