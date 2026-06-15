import { Icon } from '../../Icon';
import type { LeakagePartnerRank } from '../../../lib/admin/revenue-leakage-types';

export function LeakagePartnerRanking({ partners }: { partners: LeakagePartnerRank[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Leakage par partenaire</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase"><th className="text-left py-2">Partenaire</th><th className="text-right py-2">Montant perdu</th><th className="text-right py-2">Cas</th><th className="text-right py-2">Score</th></tr></thead>
        <tbody>{partners.map((p) => (
          <tr key={p.partner} className="border-t border-gray-50 dark:border-slate-800">
            <td className="py-2 font-medium text-gray-900 dark:text-slate-100">{p.partner}</td>
            <td className="py-2 text-right text-red-600 font-bold">{p.amountLost.toLocaleString('fr-FR')} $</td>
            <td className="py-2 text-right">{p.openCases}</td>
            <td className="py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.riskScore >= 70 ? 'bg-red-100 text-red-700' : p.riskScore >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.riskScore}/100</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
