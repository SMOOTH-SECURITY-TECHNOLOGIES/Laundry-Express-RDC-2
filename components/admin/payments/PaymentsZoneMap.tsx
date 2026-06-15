import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { PaymentZoneStats } from '../../../lib/admin/payments-types';

const W = 400; const H = 280;

export function PaymentsZoneMap({ zones }: { zones: PaymentZoneStats[] }) {
  const [selected, setSelected] = useState<PaymentZoneStats | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3"><Icon name="map" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Carte financière — Kinshasa</h3></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-gray-100 dark:border-slate-700">
        <rect width={W} height={H} fill="#f9f7f3" rx="8" />
        <polygon points="40,40 180,25 340,45 370,120 350,220 200,250 60,210 25,120" fill="#e8e4db" stroke="#d4cfc4" />
        {zones.map((z) => (
          <g key={z.id} onClick={() => setSelected(z)} className="cursor-pointer">
            <circle cx={z.mapX} cy={z.mapY} r={selected?.id === z.id ? 28 : 22} fill={z.healthColor} opacity={0.4} />
            <circle cx={z.mapX} cy={z.mapY} r="8" fill={z.healthColor} stroke="#fff" strokeWidth="2" />
            <text x={z.mapX} y={z.mapY - 28} textAnchor="middle" fontSize="7" fontWeight="600" fill="#374151">{z.name}</text>
            <text x={z.mapX} y={z.mapY + 20} textAnchor="middle" fontSize="7" fontWeight="700" fill="#1f2937">{z.revenue.toLocaleString('fr-FR')} $</text>
          </g>
        ))}
      </svg>
      {selected && (
        <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs">
          <p className="font-bold text-gray-900 dark:text-slate-100">{selected.name}</p>
          <p className="text-gray-600 dark:text-slate-400 mt-1">CA: {selected.revenue.toLocaleString('fr-FR')} $ · {selected.transactions} tx · Ticket: {selected.avgTicket.toFixed(2)} $</p>
        </div>
      )}
    </div>
  );
}
