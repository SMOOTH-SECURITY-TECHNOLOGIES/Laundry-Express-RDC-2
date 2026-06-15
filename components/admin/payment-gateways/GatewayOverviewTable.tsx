import type { PaymentGateway } from '../../../lib/admin/payment-gateways-types';

const statusStyle: Record<string, string> = {
  online: 'bg-green-100 text-green-700', degraded: 'bg-amber-100 text-amber-700',
  maintenance: 'bg-blue-100 text-blue-700', offline: 'bg-red-100 text-red-700',
};

export function GatewayOverviewTable({ gateways, onView }: { gateways: PaymentGateway[]; onView: (g: PaymentGateway) => void }) {
  if (!gateways.length) return <div className="bg-white rounded-2xl border border-dashed p-10 text-center text-sm">Aucune passerelle configurée.</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b"><h3 className="text-sm font-semibold text-gray-500 uppercase">Aperçu par passerelle</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th className="px-4 py-3 text-left">Passerelle</th><th className="px-4 py-3">Canal</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Volume</th><th className="px-4 py-3 text-right">Revenus</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3 text-right">Taux réussite</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {gateways.map((g) => (
              <tr key={g.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{g.name}</td>
                <td className="px-4 py-3 text-center text-gray-500">{g.channel}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[g.status] || 'bg-gray-100'}`}>{g.statusLabel}</span></td>
                <td className="px-4 py-3 text-right">{g.volume.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right font-semibold">{g.revenue.toLocaleString('fr-FR')} $</td>
                <td className="px-4 py-3 text-right">{g.commission.toLocaleString('fr-FR')} $</td>
                <td className="px-4 py-3 text-right">{g.successRate}%</td>
                <td className="px-4 py-3"><button type="button" onClick={() => onView(g)} className="text-xs text-blue-600 font-semibold">Voir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
