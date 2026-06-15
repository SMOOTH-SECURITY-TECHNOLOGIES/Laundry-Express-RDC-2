import { Icon } from '../../Icon';
import type { AdCampaign } from '../../../lib/admin/ads-types';

const objectiveLabel: Record<string, string> = {
  awareness: 'Awareness', traffic: 'Traffic', conversion: 'Conversion',
  retention: 'Retention', reactivation: 'Reactivation',
};

export function CampaignsTable({ campaigns }: { campaigns: AdCampaign[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="paper-plane" className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Campaign Center</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase border-b dark:border-slate-700">
              <th className="text-left py-2 px-2">Nom</th>
              <th className="text-left py-2">Objectif</th>
              <th className="text-right py-2">Budget</th>
              <th className="text-right py-2">Dépenses</th>
              <th className="text-right py-2">Conv.</th>
              <th className="text-right py-2">ROI</th>
              <th className="text-left py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 dark:border-slate-800">
                <td className="py-2.5 px-2 font-medium">{c.name}</td>
                <td className="py-2.5">{objectiveLabel[c.objective] || c.objective}</td>
                <td className="py-2.5 text-right">{c.budget.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-right">{c.spend.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-right">{c.conversions}</td>
                <td className="py-2.5 text-right font-bold text-green-600">{c.roi}x</td>
                <td className="py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
