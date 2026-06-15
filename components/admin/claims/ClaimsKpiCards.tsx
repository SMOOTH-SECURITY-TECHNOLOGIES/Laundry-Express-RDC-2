import { Icon } from '../../Icon';
import type { ClaimsKpis } from '../../../lib/admin/claims-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function ClaimsKpiCards({ kpis }: { kpis: ClaimsKpis }) {
  const cards = [
    { label: 'Réclamations ouvertes', value: kpis.openClaims, change: `${kpis.openClaimsChange}%`, icon: 'document-text' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.openClaimsSparkline },
    { label: 'Réclamations critiques', value: kpis.criticalClaims, change: `${kpis.criticalClaimsChange}%`, icon: 'fire' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.criticalClaimsSparkline },
    { label: 'Litiges actifs', value: kpis.activeDisputes, change: `${kpis.activeDisputesChange}%`, icon: 'shield' as const, color: '#8B5CF6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.activeDisputesSparkline },
    { label: 'Remboursements potentiels', value: `$${kpis.refundExposure.toLocaleString('fr-FR')}`, change: `${kpis.refundExposureChange}%`, icon: 'currencyDollar' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.refundExposureSparkline },
    { label: 'SLA respecté', value: `${kpis.slaCompliance}%`, change: `${kpis.slaComplianceChange} pts`, icon: 'clock' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.slaComplianceSparkline },
    { label: 'Temps moy. résolution', value: `${kpis.avgResolutionHours}h`, change: `${kpis.avgResolutionChange}h`, icon: 'arrow-path' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.avgResolutionSparkline },
    { label: 'Réclamations résolues', value: kpis.resolvedThisMonth, change: `${kpis.resolvedChange}%`, icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.resolvedSparkline },
    { label: 'Montant à risque', value: `$${kpis.amountAtRisk.toLocaleString('fr-FR')}`, change: `${kpis.amountAtRiskChange}%`, icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.amountAtRiskSparkline },
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
