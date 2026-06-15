import { Icon } from '../../Icon';
import type { SupportKpis } from '../../../lib/admin/support-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function SupportKpiCards({ kpis }: { kpis: SupportKpis }) {
  const cards = [
    { label: 'Tickets ouverts', value: kpis.openTickets, change: `${kpis.openTicketsChange}%`, icon: 'lifebuoy' as const, color: '#2563EB', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.openTicketsSparkline },
    { label: 'Nouveaux tickets', value: kpis.newTickets, change: `+${kpis.newTicketsChange}%`, icon: 'plus' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.newTicketsSparkline },
    { label: 'En attente client', value: kpis.waitingClient, change: `${kpis.waitingClientChange}%`, icon: 'user' as const, color: '#F59E0B', bg: 'bg-orange-100', tc: 'text-orange-600', spark: kpis.waitingClientSparkline },
    { label: 'En attente support', value: kpis.waitingSupport, change: `${kpis.waitingSupportChange}%`, icon: 'clock' as const, color: '#9333EA', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.waitingSupportSparkline },
    { label: 'SLA respecté', value: `${kpis.slaCompliance}%`, change: `+${kpis.slaComplianceChange} pts`, icon: 'shield-check' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.slaComplianceSparkline },
    { label: 'Tickets critiques', value: kpis.criticalTickets, change: `+${kpis.criticalTicketsChange}%`, icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.criticalTicketsSparkline },
    { label: 'Satisfaction', value: `${kpis.satisfaction}/5`, change: `+${kpis.satisfactionChange}`, icon: 'star' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.satisfactionSparkline },
    { label: 'Temps moy. réponse', value: `${kpis.avgResponseMinutes} min`, change: `${kpis.avgResponseChange} min`, icon: 'clock-history' as const, color: '#8B5CF6', bg: 'bg-purple-100', tc: 'text-purple-600', spark: kpis.avgResponseSparkline },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold">{typeof c.value === 'number' ? c.value.toLocaleString('fr-FR') : c.value}</p>
          <p className="text-[10px] text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium bg-gray-50 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
