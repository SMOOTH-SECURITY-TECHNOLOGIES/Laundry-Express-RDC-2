import type { OperatorPerformance } from '../../../lib/admin/sms-types';

export function OperatorPerformanceTable({ data }: { data: OperatorPerformance[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Performance par opérateur</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500"><tr><th className="pb-2">Opérateur</th><th className="pb-2">Livraison</th><th className="pb-2">Échecs</th><th className="pb-2">Temps moyen</th><th className="pb-2">Coût</th></tr></thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.slug} className="border-t">
                <td className="py-2 font-medium">{o.name}</td>
                <td className="py-2 text-green-600">{o.deliveryRate}%</td>
                <td className="py-2 text-red-600">{o.failureRate}%</td>
                <td className="py-2">{(o.avgDeliveryMs / 1000).toFixed(1)}s</td>
                <td className="py-2">{o.cost.toLocaleString('fr-FR')} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
