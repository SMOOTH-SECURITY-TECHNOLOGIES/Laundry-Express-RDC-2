import { Icon } from '../../Icon';
import type { CampaignROI } from '../../../lib/admin/campaigns-types';

export function CampaignROIWidget({ roi }: { roi: CampaignROI }) {
  const items = [
    { label: 'Budget dépensé', value: `${roi.budgetSpent.toLocaleString('fr-FR')} $` },
    { label: 'Revenus générés', value: `${roi.revenueGenerated.toLocaleString('fr-FR')} $` },
    { label: 'Coût acquisition', value: `${roi.costPerAcquisition} $` },
    { label: 'Valeur vie client', value: `${roi.customerLifetimeValue} $` },
    { label: 'ROAS', value: `${roi.roas}x` },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="currencyDollar" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Rapport ROI</h3></div>
      <div className="space-y-2">{items.map((i) => <div key={i.label} className="flex justify-between text-xs"><span className="text-gray-500">{i.label}</span><span className="font-bold">{i.value}</span></div>)}</div>
      <div className="mt-4 p-3 rounded-xl bg-green-50 text-center"><p className="text-xs text-gray-500">ROI global</p><p className="text-2xl font-bold text-green-600">{roi.globalRoi}x</p></div>
    </div>
  );
}
