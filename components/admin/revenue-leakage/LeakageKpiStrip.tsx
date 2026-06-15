import { Icon } from '../../Icon';
import type { LeakageKpis } from '../../../lib/admin/revenue-leakage-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function LeakageKpiStrip({ kpis }: { kpis: LeakageKpis }) {
  const cards = [
    { label: 'Revenue at Risk', sub: 'Montant potentiellement perdu', value: `${kpis.revenueAtRisk.toLocaleString('fr-FR')} $`, change: `+${kpis.revenueAtRiskChange}%`, icon: 'currencyDollar' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600', spark: [14200, 15500, 16100, 16800, 17200, 17900, 18450] },
    { label: 'Cas ouverts', sub: 'En cours', value: String(kpis.openCases), change: `${kpis.openCasesChange}%`, icon: 'archive-box' as const, color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: [14, 13, 12, 11, 12, 11, 10] },
    { label: 'Critiques', sub: 'Priorité haute', value: String(kpis.criticalCases), change: `+${kpis.criticalCasesChange}%`, icon: 'fire' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600', spark: [1, 2, 2, 3, 2, 3, 3] },
    { label: 'Corrigés ce mois', sub: 'Résolus', value: String(kpis.resolvedThisMonth), change: `+${kpis.resolvedChange}%`, icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: [12, 15, 17, 19, 21, 22, 24] },
    { label: 'Taux de fuite', sub: 'Revenue Leak / Total', value: `${kpis.leakRate}%`, change: `${kpis.leakRateChange}%`, icon: 'chartBar' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600', spark: [2.4, 2.2, 2.1, 2.0, 1.9, 1.85, 1.8] },
    { label: 'Temps moyen résolution', sub: 'Heures', value: `${kpis.avgResolutionHours} h`, change: `${kpis.avgResolutionChange}%`, icon: 'clock' as const, color: '#9333EA', bg: 'bg-violet-100 dark:bg-violet-900/30', tc: 'text-violet-600', spark: [6.2, 5.8, 5.4, 5.0, 4.8, 4.5, 4.2] },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 hover:scale-[1.01] transition-transform">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{c.value}</p>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
