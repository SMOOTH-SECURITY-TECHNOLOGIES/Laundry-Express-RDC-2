import type { TopPartner } from '../../../lib/admin/payment-gateways-types';

export function TopPartnersCard({ partners }: { partners: TopPartner[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Top partenaires (CA)</h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500"><tr><th className="text-left pb-2">Partenaire</th><th className="text-right pb-2">Revenus</th><th className="text-right pb-2">TX</th></tr></thead>
        <tbody>
          {partners.map((p) => (
            <tr key={p.name} className="border-t"><td className="py-2 font-medium">{p.name}</td><td className="py-2 text-right">{p.revenue.toLocaleString('fr-FR')} $</td><td className="py-2 text-right">{p.transactions}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
