import { Icon } from '../../Icon';
import type { TopRedeemer } from '../../../lib/admin/loyalty-types';

export function TopRedeemers({ redeemers }: { redeemers: TopRedeemer[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="gift" className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-semibold">Top redeemers</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2">Client</th><th className="text-right py-2">Pts utilisés</th><th className="text-right py-2">Économisé</th><th className="text-right py-2">Cmd.</th></tr></thead>
        <tbody>
          {redeemers.map((r) => (
            <tr key={r.userId} className="border-b border-gray-50 dark:border-slate-800">
              <td className="py-2.5 font-medium">{r.name}</td>
              <td className="py-2.5 text-right font-bold">{r.pointsUsed.toLocaleString('fr-FR')}</td>
              <td className="py-2.5 text-right text-green-600">{r.amountSaved} $</td>
              <td className="py-2.5 text-right">{r.linkedOrders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
