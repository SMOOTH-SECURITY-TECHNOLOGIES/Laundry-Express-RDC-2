import { Icon } from '../../Icon';
import type { LoyaltyActivity } from '../../../lib/admin/loyalty-types';

const badgeStyle: Record<string, string> = {
  earn: 'bg-green-100 text-green-700',
  redeem: 'bg-blue-100 text-blue-700',
  expire: 'bg-gray-100 text-gray-600',
  referral_bonus: 'bg-purple-100 text-purple-700',
  adjustment: 'bg-orange-100 text-orange-700',
};

const badgeLabel: Record<string, string> = {
  earn: 'Earn', redeem: 'Redeem', expire: 'Expire', referral_bonus: 'Referral', adjustment: 'Admin adjustment',
};

export function LoyaltyActivityTable({ activity }: { activity: LoyaltyActivity[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="clock-history" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Activité fidélité récente</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2 px-2">Client</th><th className="text-left py-2">Type</th><th className="text-left py-2">Commande</th><th className="text-right py-2">Delta</th><th className="text-right py-2">Balance</th><th className="text-left py-2">Date</th><th className="text-left py-2">Source</th></tr></thead>
          <tbody>
            {activity.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 dark:border-slate-800">
                <td className="py-2.5 px-2"><div className="font-medium">{a.clientName}</div><div className="text-gray-500">{a.clientEmail}</div></td>
                <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle[a.entryType] || 'bg-gray-100'}`}>{badgeLabel[a.entryType] || a.entryType}</span></td>
                <td className="py-2.5">{a.orderNumber || '—'}</td>
                <td className={`py-2.5 text-right font-bold ${a.pointsDelta >= 0 ? 'text-green-600' : 'text-orange-600'}`}>{a.pointsDelta >= 0 ? `+${a.pointsDelta}` : a.pointsDelta}</td>
                <td className="py-2.5 text-right">{a.balanceAfter}</td>
                <td className="py-2.5">{a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : '—'}</td>
                <td className="py-2.5">{a.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
