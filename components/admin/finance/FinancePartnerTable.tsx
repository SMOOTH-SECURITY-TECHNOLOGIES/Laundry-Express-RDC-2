import { Icon } from '../../Icon';
import type { PartnerRevenueRow } from '../../../lib/admin/finance-types';

const trendIcon = (t: string) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
const trendColor = (t: string) => t === 'up' ? 'text-green-600' : t === 'down' ? 'text-red-600' : 'text-gray-500';

export function FinancePartnerTable({ partners }: { partners: PartnerRevenueRow[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="users" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Top 5 partenaires</h3></div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">Revenu</th><th className="pb-2 font-medium">Commandes</th>
            <th className="pb-2 font-medium">Commission</th><th className="pb-2 font-medium">Tendance</th>
          </tr></thead>
          <tbody>
            {partners.slice(0, 5).map((p, i) => (
              <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{i + 1}. {p.name}</td>
                <td className="py-2.5 font-semibold text-gray-900 dark:text-slate-100">{p.revenue.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-gray-600 dark:text-slate-400">{p.orders}</td>
                <td className="py-2.5 text-gray-600 dark:text-slate-400">{p.commission.toLocaleString('fr-FR')} $</td>
                <td className={`py-2.5 font-bold ${trendColor(p.trend)}`}>{trendIcon(p.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
