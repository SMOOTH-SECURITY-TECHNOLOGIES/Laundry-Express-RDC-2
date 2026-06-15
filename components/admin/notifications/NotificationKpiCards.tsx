import { Icon } from '../../Icon';
import type { NotificationKpis } from '../../../lib/admin/notifications-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function NotificationKpiCards({ kpis }: { kpis: NotificationKpis }) {
  const cards = [
    { label: 'Total envoyées', value: kpis.totalSent.toLocaleString('fr-FR'), change: `+${kpis.totalSentChange}%`, icon: 'paper-plane' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.totalSentSparkline },
    { label: 'Taux de livraison', value: `${kpis.deliveryRate}%`, change: `+${kpis.deliveryRateChange}%`, icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.deliveryRateSparkline },
    { label: 'Taux ouverture Email', value: `${kpis.emailOpenRate}%`, change: `+${kpis.emailOpenRateChange}%`, icon: 'envelope' as const, color: '#8B5CF6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.emailOpenRateSparkline },
    { label: 'Taux de clics', value: `${kpis.clickRate}%`, change: `+${kpis.clickRateChange}%`, icon: 'chartBar' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.clickRateSparkline },
    { label: 'Désabonnements', value: kpis.unsubscribes.toLocaleString('fr-FR'), change: `${kpis.unsubscribesChange}%`, icon: 'xmark' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.unsubscribesSparkline },
    { label: 'Erreurs / Échecs', value: kpis.errors.toLocaleString('fr-FR'), change: `+${kpis.errorsChange}%`, icon: 'warning' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.errorsSparkline },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold">{c.value}</p>
          <p className="text-[10px] text-gray-500">{c.label}</p>
          <span className="text-[10px] bg-gray-50 rounded-full px-2 py-0.5 mt-1 inline-block">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
