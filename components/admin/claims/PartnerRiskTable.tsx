import type { PartnerRisk } from '../../../lib/admin/claims-types';

export function PartnerRiskTable({ partners }: { partners: PartnerRisk[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Top partenaires à risque</h3>
      {partners.length === 0 ? <p className="text-sm text-gray-400">Aucune donnée partenaire.</p> : (
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="text-left py-2">Partenaire</th><th className="text-right py-2">Réclamations</th><th className="text-right py-2">Note</th><th className="text-right py-2">Remb.</th><th className="text-right py-2">Risque</th></tr></thead>
          <tbody className="divide-y">
            {partners.map((p) => (
              <tr key={p.partnerId}><td className="py-2">{p.partnerName}</td><td className="text-right">{p.claimCount}</td><td className="text-right">{p.avgRating.toFixed(1)}</td><td className="text-right">${p.refundAmount.toLocaleString('fr-FR')}</td><td className="text-right font-semibold text-red-600">{p.riskScore}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
