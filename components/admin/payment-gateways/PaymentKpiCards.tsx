import { Icon } from '../../Icon';
import type { PaymentGatewayKpis } from '../../../lib/admin/payment-gateways-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function fmt(n: number) { return n.toLocaleString('fr-FR'); }

export function PaymentKpiCards({ kpis }: { kpis: PaymentGatewayKpis }) {
  const cards = [
    { label: 'Tendance revenus', value: `+${kpis.revenueTrend}%`, sub: '', icon: 'chartBar' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.revenueTrendSparkline },
    { label: "Revenu aujourd'hui", value: `${fmt(kpis.revenueToday)} $`, sub: `${kpis.revenueTodayTx} tx · +${kpis.revenueTodayChange}%`, icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: [] },
    { label: 'Revenu semaine', value: `${fmt(kpis.revenueWeek)} $`, sub: `${kpis.revenueWeekTx} tx · +${kpis.revenueWeekChange}%`, icon: 'chartBar' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: [] },
    { label: 'Revenu mois', value: `${fmt(kpis.revenueMonth)} $`, sub: `${kpis.revenueMonthTx} tx · +${kpis.revenueMonthChange}%`, icon: 'chartBar' as const, color: '#8B5CF6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: [] },
    { label: 'Commissions dues', value: `${fmt(kpis.commissionsDue)} $`, sub: `${kpis.commissionsDueOps} opérations`, icon: 'wallet' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: [] },
    { label: 'Commissions payées', value: `${fmt(kpis.commissionsPaid)} $`, sub: `${kpis.commissionsPaidOps} opérations`, icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: [] },
    { label: 'Cash en transit', value: `${fmt(kpis.cashInTransit)} $`, sub: `${kpis.cashInTransitOps} opérations`, icon: 'truck' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: [] },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
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
