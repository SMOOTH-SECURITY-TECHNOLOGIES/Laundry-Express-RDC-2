import { Icon } from '../../Icon';
import type { CommissionTopPartner } from '../../../lib/admin/commissions-types';

export function CommissionTopPartners({ partners }: { partners: CommissionTopPartner[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="trophy" className="w-5 h-5 text-amber-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Top partenaires par commissions</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">Revenu</th><th className="pb-2 font-medium">Commission</th>
            <th className="pb-2 font-medium">Croissance</th><th className="pb-2 font-medium">Score</th>
          </tr></thead>
          <tbody>
            {partners.slice(0, 10).map((p, i) => (
              <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800">
                <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{i + 1}. {p.name}</td>
                <td className="py-2.5">{p.revenue.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 font-semibold text-green-600">{p.commission.toLocaleString('fr-FR')} $</td>
                <td className={`py-2.5 font-medium ${p.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{p.growth >= 0 ? '+' : ''}{p.growth}%</td>
                <td className="py-2.5 text-amber-500">★ {p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
