import { Icon } from '../../Icon';
import type { EmailKpis } from '../../../lib/admin/email-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function chg(n: number, suffix = '%') { return `${n >= 0 ? '+' : ''}${n}${suffix}`; }

export function EmailKpiCards({ kpis }: { kpis: EmailKpis }) {
  const cards = [
    { label: "Emails envoyés aujourd'hui", value: kpis.sentToday.toLocaleString('fr-FR'), sub: chg(kpis.sentTodayChange), icon: 'paper-plane' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.sentTodaySparkline },
    { label: 'Taux livraison', value: `${kpis.deliveryRate}%`, sub: chg(kpis.deliveryRateChange), icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.deliveryRateSparkline },
    { label: 'Taux ouverture', value: `${kpis.openRate}%`, sub: chg(kpis.openRateChange), icon: 'envelope' as const, color: '#8B5CF6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.openRateSparkline },
    { label: 'Taux clic', value: `${kpis.clickRate}%`, sub: chg(kpis.clickRateChange), icon: 'share' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.clickRateSparkline },
    { label: 'Bounces', value: String(kpis.bounces), sub: chg(kpis.bouncesChange), icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.bouncesSparkline },
    { label: 'Désabonnements', value: String(kpis.unsubscribes), sub: chg(kpis.unsubscribesChange), icon: 'xmark' as const, color: '#EC4899', bg: 'bg-pink-100', tc: 'text-pink-600', spark: kpis.unsubscribesSparkline },
    { label: 'Templates actifs', value: String(kpis.activeTemplates), sub: `+${kpis.activeTemplatesChange}`, icon: 'document-text' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.activeTemplatesSparkline },
    { label: 'Revenus attribués', value: `${kpis.attributedRevenue.toLocaleString('fr-FR')} $`, sub: chg(kpis.attributedRevenueChange), icon: 'currencyDollar' as const, color: '#EAB308', bg: 'bg-yellow-100', tc: 'text-yellow-600', spark: kpis.attributedRevenueSparkline },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold">{c.value}</p>
          <p className="text-[10px] text-gray-500">{c.label}</p>
          {c.sub && <span className="text-[10px] text-gray-400">{c.sub}</span>}
        </div>
      ))}
    </div>
  );
}
