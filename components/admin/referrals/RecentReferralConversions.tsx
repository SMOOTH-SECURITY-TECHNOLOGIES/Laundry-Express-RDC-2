import { Icon } from '../../Icon';
import type { ReferralConversion, ReferralStatus } from '../../../lib/admin/referrals-types';

const statusStyle: Record<string, string> = {
  converted: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  suspect: 'bg-orange-100 text-orange-700',
  signed_up: 'bg-blue-100 text-blue-700',
};

const statusLabel: Record<string, string> = {
  converted: 'Converti',
  pending: 'En attente',
  rejected: 'Rejeté',
  suspect: 'Suspect',
  signed_up: 'Inscrit',
};

interface Props {
  conversions: ReferralConversion[];
  statusFilter?: string;
  search?: string;
}

export function RecentReferralConversions({ conversions, statusFilter = 'all', search = '' }: Props) {
  const q = search.toLowerCase();
  const rows = conversions.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (!q) return true;
    return c.refereeName.toLowerCase().includes(q) || c.refereeEmail.toLowerCase().includes(q) || (c.orderId || '').toLowerCase().includes(q);
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="arrow-path" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold">Conversions récentes</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">Aucune conversion récente.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-2">Filleul</th>
                <th className="pb-2 pr-2">Commande</th>
                <th className="pb-2 pr-2">Date</th>
                <th className="pb-2 pr-2">Réduction</th>
                <th className="pb-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 dark:border-slate-800">
                  <td className="py-2 pr-2">
                    <p className="font-medium">{c.refereeName}</p>
                    <p className="text-[10px] text-gray-400">{c.refereeEmail}</p>
                  </td>
                  <td className="py-2 pr-2 font-mono">{c.orderId || '—'}</td>
                  <td className="py-2 pr-2">{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="py-2 pr-2">{c.discountUsed.toFixed(2)} $</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle[c.status as ReferralStatus] || statusStyle.pending}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
