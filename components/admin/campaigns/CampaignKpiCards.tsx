import { Icon } from '../../Icon';
import type { CampaignKpis } from '../../../lib/admin/campaigns-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function CampaignKpiCards({ kpis }: { kpis: CampaignKpis }) {
  const cards = [
    { label: 'Campagnes actives', value: kpis.activeCampaigns.toLocaleString('fr-FR'), change: `+${kpis.activeCampaignsChange}%`, icon: 'paper-plane' as const, color: '#2563EB', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.activeCampaignsSparkline },
    { label: 'Messages envoyés', value: kpis.messagesSent.toLocaleString('fr-FR'), change: `+${kpis.messagesSentChange}%`, icon: 'chatBubble' as const, color: '#9333EA', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.messagesSentSparkline },
    { label: 'Taux ouverture', value: `${kpis.openRate}%`, change: `+${kpis.openRateChange} pts`, icon: 'envelope' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.openRateSparkline },
    { label: 'Taux clic', value: `${kpis.clickRate}%`, change: `+${kpis.clickRateChange} pts`, icon: 'share' as const, color: '#F59E0B', bg: 'bg-orange-100', tc: 'text-orange-600', spark: kpis.clickRateSparkline },
    { label: 'Conversions', value: kpis.conversions.toLocaleString('fr-FR'), change: `+${kpis.conversionsChange}%`, icon: 'badge-check' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.conversionsSparkline },
    { label: 'Revenus attribués', value: `${kpis.attributedRevenue.toLocaleString('fr-FR')} $`, change: `+${kpis.attributedRevenueChange}%`, icon: 'wallet' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.attributedRevenueSparkline },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold">{c.value}</p>
          <p className="text-[10px] text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium bg-gray-50 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
