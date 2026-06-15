import { Icon } from '../../Icon';
import type { PopularReferralCode } from '../../../lib/admin/referrals-types';

export function PopularCodesTable({ codes, search = '' }: { codes: PopularReferralCode[]; search?: string }) {
  const q = search.toLowerCase();
  const rows = codes.filter((c) => !q || c.code.toLowerCase().includes(q));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="code-bracket" className="w-5 h-5 text-violet-600" />
        <h3 className="text-sm font-semibold">Codes populaires</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">Aucun code actif.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-2">Code</th>
                <th className="pb-2 pr-2">Utilisations</th>
                <th className="pb-2 pr-2">Conversions</th>
                <th className="pb-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.code} className="border-b border-gray-50 dark:border-slate-800">
                  <td className="py-2 pr-2 font-mono font-bold">{c.code}</td>
                  <td className="py-2 pr-2">{c.uses}</td>
                  <td className="py-2 pr-2">{c.conversions}</td>
                  <td className="py-2 font-bold text-green-600">{c.roi}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
