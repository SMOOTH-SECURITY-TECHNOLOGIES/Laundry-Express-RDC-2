import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { SlaTimelinePeriod, SlaTimelinePoint } from '../../../lib/admin/sla-types';

const PERIODS: { id: SlaTimelinePeriod; label: string }[] = [
  { id: '24h', label: '24h' }, { id: '7d', label: '7 jours' }, { id: '30d', label: '30 jours' }, { id: '90d', label: '90 jours' },
];

export function SlaTimeline({ timeline }: { timeline: Record<SlaTimelinePeriod, SlaTimelinePoint[]> }) {
  const [period, setPeriod] = useState<SlaTimelinePeriod>('7d');
  const points = timeline[period] ?? [];
  const maxSla = 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="chartBar" className="w-5 h-5 text-gray-700" /><h3 className="text-sm font-semibold text-gray-900">Évolution du SLA</h3></div>
        <div className="flex gap-1">{PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`px-2 py-1 rounded-lg text-[10px] font-medium ${period === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{p.label}</button>
        ))}</div>
      </div>
      <div className="flex items-end gap-1 h-32">
        {points.map((p) => (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col gap-0.5 items-center" style={{ height: '100%' }}>
              <div className="w-full bg-green-500 rounded-t-sm" style={{ height: `${(p.slaPercent / maxSla) * 80}%`, minHeight: 2 }} title={`SLA ${Math.round(p.slaPercent)}%`} />
              <div className="w-full bg-orange-400 rounded-t-sm" style={{ height: `${p.delays * 4}%`, minHeight: 1 }} title={`Retards ${p.delays}`} />
            </div>
            <span className="text-[8px] text-gray-400 truncate w-full text-center">{p.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-sm" /> SLA %</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-sm" /> Retards</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-sm" /> Incidents</span>
      </div>
    </div>
  );
}
