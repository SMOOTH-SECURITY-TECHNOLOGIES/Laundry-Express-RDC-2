import { Icon } from '../../Icon';
import type { SlaPartnerPerformance } from '../../../lib/admin/sla-types';

export function SlaPartnerRanking({ partners }: { partners: SlaPartnerPerformance[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="users" className="w-5 h-5 text-gray-700" /><h3 className="text-sm font-semibold text-gray-900">Performance partenaires</h3></div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 border-b">
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">SLA</th><th className="pb-2 font-medium">ETA</th>
            <th className="pb-2 font-medium">Volume</th><th className="pb-2 font-medium">Litiges</th><th className="pb-2 font-medium">Note</th>
          </tr></thead>
          <tbody>
            {partners.slice(0, 10).map((p, i) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5"><span className="font-medium text-gray-900">{i + 1}. {p.name}</span></td>
                <td className="py-2.5 font-semibold text-green-600">{p.slaPercent}%</td>
                <td className="py-2.5 text-gray-600">{p.etaLabel}</td>
                <td className="py-2.5 text-gray-600">{p.volume}</td>
                <td className="py-2.5 text-gray-600">{p.disputes}</td>
                <td className="py-2.5 text-amber-500">★ {p.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
