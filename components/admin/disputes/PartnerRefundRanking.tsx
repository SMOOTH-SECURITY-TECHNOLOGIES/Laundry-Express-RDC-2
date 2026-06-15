import type { PartnerRefundRanking as PartnerRefundRankingType } from '../../../lib/admin/disputes-types';

interface PartnerRefundRankingProps {
  partners: PartnerRefundRankingType[];
}

export function PartnerRefundRanking({ partners }: PartnerRefundRankingProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-500">Partenaire</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Demandes</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Montant</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Taux acceptation</th>
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr key={partner.name} className="border-b border-slate-100 last:border-0">
              <td className="py-3 px-4 font-medium text-slate-800">{partner.name}</td>
              <td className="py-3 px-4 text-right text-slate-600">{partner.requests}</td>
              <td className="py-3 px-4 text-right text-slate-800 font-medium">
                ${partner.amount.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    partner.acceptanceRate >= 80
                      ? 'bg-emerald-50 text-emerald-700'
                      : partner.acceptanceRate >= 50
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {partner.acceptanceRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
