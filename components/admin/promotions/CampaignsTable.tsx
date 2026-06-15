import { Icon } from '../../Icon';
import type { PromoCampaign } from '../../../lib/admin/promotions-types';

export function CampaignsTable({ campaigns }: { campaigns: PromoCampaign[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="paper-plane" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Campagnes récentes</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2">Campagne</th><th className="text-left py-2">Audience</th><th className="text-right py-2">Budget</th><th className="text-right py-2">Conversions</th><th className="text-right py-2">ROI</th></tr></thead>
        <tbody>{campaigns.map((c) => (
          <tr key={c.id} className="border-b border-gray-50 dark:border-slate-800">
            <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{c.name}</td>
            <td className="py-2.5 text-gray-500">{c.audience}</td>
            <td className="py-2.5 text-right">{c.budget.toLocaleString('fr-FR')} $</td>
            <td className="py-2.5 text-right font-bold">{c.conversions}</td>
            <td className="py-2.5 text-right text-green-600 font-bold">{c.roi}x</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
