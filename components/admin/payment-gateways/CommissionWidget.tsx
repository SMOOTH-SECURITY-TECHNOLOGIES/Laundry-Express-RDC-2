import type { CommissionSummary } from '../../../lib/admin/payment-gateways-types';

export function CommissionWidget({ commissions }: { commissions: CommissionSummary }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Commissions</h3>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><p className="text-xs text-gray-500">Générées</p><p className="font-bold">{commissions.generated.toLocaleString('fr-FR')} $</p></div>
        <div><p className="text-xs text-gray-500">Payées</p><p className="font-bold text-green-600">{commissions.paid.toLocaleString('fr-FR')} $</p></div>
        <div><p className="text-xs text-gray-500">En attente</p><p className="font-bold text-amber-600">{commissions.pending.toLocaleString('fr-FR')} $</p></div>
        <div><p className="text-xs text-gray-500">Annulées</p><p className="font-bold text-gray-500">{commissions.cancelled.toLocaleString('fr-FR')} $</p></div>
      </div>
      <ul className="space-y-1 text-xs">
        {commissions.distribution.map((d) => (
          <li key={d.label} className="flex justify-between"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.label}</span><span>{d.percent}%</span></li>
        ))}
      </ul>
    </div>
  );
}
