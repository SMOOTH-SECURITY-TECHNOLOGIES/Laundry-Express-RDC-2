import { AdminServiceHealthItem } from '../../../lib/admin/services-types';
import { getScoreColor, getSlaColor, formatPercent } from '../../../lib/admin/services-formatters';
import { Icon } from '../../Icon';

interface ServiceHealthTableProps {
  services: AdminServiceHealthItem[];
}

export default function ServiceHealthTable({ services }: ServiceHealthTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon name="shield-check" className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-semibold text-gray-900">Santé des services</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Disponibilité</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">SLA</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Retards</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Litiges</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Remb.</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-600">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {services.map((service) => (
              <tr key={service.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{service.name}</td>
                <td className="text-center px-3 py-3">
                  <span className={getSlaColor(service.availability)}>
                    {formatPercent(service.availability)}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={getSlaColor(service.sla)}>
                    {formatPercent(service.sla)}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={service.delays > 5 ? 'text-red-600' : service.delays > 2 ? 'text-yellow-600' : 'text-green-600'}>
                    {service.delays}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={service.disputes > 3 ? 'text-red-600' : service.disputes > 1 ? 'text-yellow-600' : 'text-green-600'}>
                    {service.disputes}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={service.refunds > 2 ? 'text-red-600' : service.refunds > 0 ? 'text-yellow-600' : 'text-green-600'}>
                    {service.refunds}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getScoreColor(service.score)}`}>
                    {service.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {services.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-8">Aucune donnée de santé disponible</p>
      )}
    </div>
  );
}
