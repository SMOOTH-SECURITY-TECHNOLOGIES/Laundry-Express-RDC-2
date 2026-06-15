import { Icon } from '../../Icon';
import type { EarningRule } from '../../../lib/admin/loyalty-types';

export function EarningRulesTable({ rules }: { rules: EarningRule[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="list" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Règles de gain</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2">Règle</th><th className="text-left py-2">Condition</th><th className="text-left py-2">Points</th><th className="text-left py-2">Statut</th><th className="text-right py-2">Performance</th></tr></thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 dark:border-slate-800">
              <td className="py-2.5 font-medium">{r.name}</td>
              <td className="py-2.5">{r.condition}</td>
              <td className="py-2.5">{r.points}</td>
              <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{r.status}</span></td>
              <td className="py-2.5 text-right font-bold">{r.performance.toLocaleString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
