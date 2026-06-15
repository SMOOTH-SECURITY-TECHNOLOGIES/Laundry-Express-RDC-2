import { Icon } from '../../Icon';
import type { Campaign } from '../../../lib/admin/campaigns-types';

export function TopCampaignsCard({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="trophy" className="w-5 h-5 text-amber-500" /><h3 className="text-sm font-semibold">Top campagnes</h3></div>
      <table className="w-full text-xs"><thead><tr className="text-gray-500 border-b"><th className="pb-2 text-left">Campagne</th><th className="pb-2">Canal</th><th className="pb-2">ROI</th><th className="pb-2">Conv.</th><th className="pb-2">Revenus</th></tr></thead>
        <tbody>{campaigns.map((c) => <tr key={c.id} className="border-b"><td className="py-2 font-medium">{c.name}</td><td className="py-2 text-center">{c.channel}</td><td className="py-2 text-center font-bold text-green-600">{c.roi}x</td><td className="py-2 text-center">{c.conversions}</td><td className="py-2 text-right">{c.revenue.toLocaleString('fr-FR')} $</td></tr>)}</tbody>
      </table>
    </div>
  );
}
