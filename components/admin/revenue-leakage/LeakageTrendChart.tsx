import { useState } from 'react';
import { Icon } from '../../Icon';
import type { LeakageTrendPoint, LeakageTrendPeriod } from '../../../lib/admin/revenue-leakage-types';

const periods: { key: LeakageTrendPeriod; label: string }[] = [
  { key: 'day', label: 'Jour' }, { key: 'week', label: 'Semaine' }, { key: 'month', label: 'Mois' },
  { key: 'quarter', label: 'Trimestre' }, { key: 'year', label: 'Année' },
];

export function LeakageTrendChart({ trend }: { trend: Record<LeakageTrendPeriod, LeakageTrendPoint[]> }) {
  const [period, setPeriod] = useState<LeakageTrendPeriod>('week');
  const data = trend[period] || [];
  const maxAmt = Math.max(...data.map((d) => d.amountAtRisk), 1);
  const w = 280; const h = 100;

  const line = (key: keyof LeakageTrendPoint, color: string, scale: number) => {
    const pts = data.map((d, i) => {
      const v = Number(d[key]) / scale;
      return `${(i / Math.max(data.length - 1, 1)) * w},${h - v * h}`;
    }).join(' ');
    return <polyline key={key} points={pts} fill="none" stroke={color} strokeWidth="2" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="chartBar" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Leakage Trends</h3></div>
        <div className="flex gap-1">{periods.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={`px-2 py-1 rounded-lg text-[10px] font-medium ${period === p.key ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}>{p.label}</button>
        ))}</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
        {line('openCases', '#2563EB', Math.max(...data.map((d) => d.openCases), 1))}
        {line('amountAtRisk', '#EF4444', maxAmt)}
        {line('resolved', '#22C55E', Math.max(...data.map((d) => d.resolved), 1))}
      </svg>
      <div className="flex gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" />Cas ouverts</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600" />Montants</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600" />Résolutions</span>
      </div>
    </div>
  );
}
