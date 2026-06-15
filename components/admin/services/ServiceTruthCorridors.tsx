import { AdminServiceTruthCorridor } from '../../../lib/admin/services-types';
import { getAnomalyColor, formatNumber } from '../../../lib/admin/services-formatters';
import { Icon } from '../../Icon';

interface ServiceTruthCorridorsProps {
  corridors: AdminServiceTruthCorridor[];
}

export default function ServiceTruthCorridors({ corridors }: ServiceTruthCorridorsProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon name="shield" className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900">Anomalies par corridor de vérité</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Commande</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Paiement</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Logistique</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {corridors.map((corridor) => (
              <tr key={corridor.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{corridor.name}</td>
                <td className="text-center px-3 py-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${getAnomalyColor(corridor.order)}`}>
                    {corridor.order}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${getAnomalyColor(corridor.payment)}`}>
                    {corridor.payment}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${getAnomalyColor(corridor.logistics)}`}>
                    {corridor.logistics}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${getAnomalyColor(corridor.total)}`}>
                    {corridor.total}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {corridors.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-8">Aucune anomalie détectée</p>
      )}
    </div>
  );
}
