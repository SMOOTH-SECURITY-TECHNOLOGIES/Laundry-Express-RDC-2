import type { RefundCenter } from '../../../lib/admin/claims-types';

export function RefundCenterCard({ refunds }: { refunds: RefundCenter }) {
  const cards = [
    { label: 'Remboursements demandés', count: refunds.pendingCount, amount: refunds.pendingAmount, color: 'border-amber-200 bg-amber-50' },
    { label: 'Remboursements approuvés', count: refunds.approvedCount, amount: refunds.approvedAmount, color: 'border-green-200 bg-green-50' },
    { label: 'Remboursements refusés', count: refunds.rejectedCount, amount: refunds.rejectedAmount, color: 'border-red-200 bg-red-50' },
    { label: 'Montant total exposé', count: null, amount: refunds.totalExposure, color: 'border-purple-200 bg-purple-50' },
  ];
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Montants à risque</h3>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-3 ${c.color}`}>
            <p className="text-xs text-gray-600">{c.label}</p>
            {c.count !== null && <p className="text-lg font-bold">{c.count}</p>}
            <p className="text-sm font-semibold">${c.amount.toLocaleString('fr-FR')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
