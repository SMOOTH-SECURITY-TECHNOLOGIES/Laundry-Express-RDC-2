import { Icon } from '../../Icon';
import type { AdsKpis } from '../../../lib/admin/ads-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50;
  const h = 20;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function fmtChange(v: number, suffix = '%') {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v}${suffix}`;
}

export function AdsKpiStrip({ kpis }: { kpis: AdsKpis }) {
  const cards = [
    { label: 'Publicités actives', value: String(kpis.activeAds), change: fmtChange(kpis.activeAdsChange), icon: 'paper-plane' as const, color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: kpis.activeAdsSparkline },
    { label: 'Impressions', value: kpis.impressions.toLocaleString('fr-FR'), change: fmtChange(kpis.impressionsChange), icon: 'chartBar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: kpis.impressionsSparkline },
    { label: 'Clics', value: kpis.clicks.toLocaleString('fr-FR'), change: fmtChange(kpis.clicksChange), icon: 'share' as const, color: '#9333EA', bg: 'bg-violet-100 dark:bg-violet-900/30', tc: 'text-violet-600', spark: kpis.clicksSparkline },
    { label: 'CTR', value: `${kpis.ctr}%`, change: fmtChange(kpis.ctrChange, ' pts'), icon: 'chartBar' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600', spark: kpis.ctrSparkline },
    { label: 'Conversions', value: kpis.conversions.toLocaleString('fr-FR'), change: fmtChange(kpis.conversionsChange), icon: 'check' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600', spark: kpis.conversionsSparkline },
    { label: 'Dépenses', value: `${kpis.spend.toLocaleString('fr-FR')} $`, change: fmtChange(kpis.spendChange), icon: 'currencyDollar' as const, color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: kpis.spendSparkline },
    { label: 'ROI', value: `${kpis.roi}x`, change: fmtChange(kpis.roiChange, 'x'), icon: 'chartBar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: kpis.roiSparkline },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 hover:scale-[1.01] transition-transform">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}>
              <Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} />
            </div>
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
