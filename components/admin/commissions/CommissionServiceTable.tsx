import { Icon } from '../../Icon';
import type { CommissionServiceRow } from '../../../lib/admin/commissions-types';

export function CommissionServiceTable({ services }: { services: CommissionServiceRow[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="list" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Commissions par service</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
            <th className="pb-2 font-medium">Service</th><th className="pb-2 font-medium">Taux</th><th className="pb-2 font-medium">CA généré</th>
            <th className="pb-2 font-medium">Commission générée</th><th className="pb-2 font-medium">Commission payée</th><th className="pb-2 font-medium">Commission due</th>
          </tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{s.service}</td>
                <td className="py-2.5 text-purple-600 font-semibold">{s.rate}%</td>
                <td className="py-2.5 text-gray-600 dark:text-slate-400">{s.revenue.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-gray-900 dark:text-slate-100">{s.generated.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-green-600">{s.paid.toLocaleString('fr-FR')} $</td>
                <td className="py-2.5 text-orange-600">{s.due.toLocaleString('fr-FR')} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
