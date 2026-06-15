import { Icon } from '../../Icon';
import type { TopReferrer } from '../../../lib/admin/referrals-types';

interface Props {
  referrers: TopReferrer[];
  onSelect?: (r: TopReferrer) => void;
  search?: string;
}

export function TopReferrersTable({ referrers, onSelect, search = '' }: Props) {
  const q = search.toLowerCase();
  const rows = referrers.filter((r) =>
    !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.referralCode || '').toLowerCase().includes(q),
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="trophy" className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold">Top parrains</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">Aucun parrain pour cette période.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-2">Rang</th>
                <th className="pb-2 pr-2">Parrain</th>
                <th className="pb-2 pr-2">Code</th>
                <th className="pb-2 pr-2">Filleuls</th>
                <th className="pb-2 pr-2">Conversions</th>
                <th className="pb-2 pr-2">Points bonus</th>
                <th className="pb-2">Revenus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => onSelect?.(r)}>
                  <td className="py-2 pr-2 font-bold">#{r.rank}</td>
                  <td className="py-2 pr-2">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-[10px] text-gray-400">{r.email}</p>
                  </td>
                  <td className="py-2 pr-2 font-mono">{r.referralCode || '—'}</td>
                  <td className="py-2 pr-2">{r.referees}</td>
                  <td className="py-2 pr-2">{r.conversions}</td>
                  <td className="py-2 pr-2">{r.bonusPoints.toLocaleString('fr-FR')} pts</td>
                  <td className="py-2 font-bold text-green-600">{r.revenueGenerated.toLocaleString('fr-FR')} $</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
