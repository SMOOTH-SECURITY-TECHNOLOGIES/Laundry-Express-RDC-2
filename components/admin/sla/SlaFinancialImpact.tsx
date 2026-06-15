import { Icon } from '../../Icon';
import type { SlaFinancialImpact as SlaFinancialImpactData } from '../../../lib/admin/sla-types';

export function SlaFinancialImpact({ data }: { data: SlaFinancialImpactData }) {
  const items = [
    { label: 'Compensations', value: data.compensations },
    { label: 'Remboursements', value: data.refunds },
    { label: 'Commissions perdues', value: data.lostCommissions },
    { label: 'Clients perdus (est.)', value: data.lostClients },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="currencyDollar" className="w-5 h-5 text-emerald-600" />
        <h3 className="text-sm font-semibold text-gray-900">Impact financier</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Coût du mois', value: data.totalMonth },
          { label: 'Coût semaine', value: data.totalWeek },
          { label: "Coût aujourd'hui", value: data.totalToday },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
            <p className="text-lg font-bold text-emerald-700">{k.value.toLocaleString('fr-FR')} $</p>
            <p className="text-[10px] text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.label} className="flex justify-between text-xs py-2 border-b border-gray-50">
            <span className="text-gray-600">{i.label}</span>
            <span className="font-semibold text-gray-900">{i.value.toLocaleString('fr-FR')} $</span>
          </div>
        ))}
      </div>
    </div>
  );
}
