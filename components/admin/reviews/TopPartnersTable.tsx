import { Icon } from '../../Icon';
import type { TopPartner } from '../../../lib/admin/reviews-types';

export function TopPartnersTable({ partners }: { partners: TopPartner[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="building" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold">Top partenaires</h3></div>
      <table className="w-full text-xs"><thead className="text-gray-500"><tr><th className="text-left py-2">Partenaire</th><th className="text-right py-2">Note</th><th className="text-right py-2">Avis</th></tr></thead>
        <tbody>{partners.slice(0, 10).map((p) => <tr key={p.partnerId} className="border-t"><td className="py-2">{p.partnerName}</td><td className="py-2 text-right text-amber-600 font-medium">★ {p.avgRating}</td><td className="py-2 text-right">{p.reviewCount}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
