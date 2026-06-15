import { Icon } from '../../Icon';
import type { RefundPartnerStats } from '../../../lib/admin/refunds-types';

export function RefundPartnerTable({ partners }: { partners: RefundPartnerStats[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Top partenaires</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">Demandes</th><th className="pb-2 font-medium">Montant</th>
            <th className="pb-2 font-medium">Taux remb.</th><th className="pb-2 font-medium">SLA</th><th className="pb-2 font-medium">Score</th>
          </tr></thead>
          <tbody>
            {partners.map((p, i) => (
              <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800">
                <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{i + 1}. {p.name}</td>
                <td className="py-2.5">{p.requests}</td>
                <td className="py-2.5">{p.amount.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5">{p.refundRate}%</td>
                <td className="py-2.5 text-green-600">{p.slaPercent}%</td>
                <td className="py-2.5 text-amber-500">★ {p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
