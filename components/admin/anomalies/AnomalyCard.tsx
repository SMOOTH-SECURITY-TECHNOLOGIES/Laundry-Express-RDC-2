import { AnomalyItem } from '../../../lib/admin/anomalies-types';
import { getSeverityLabel, getCorridorLabel } from '../../../lib/admin/anomalies-formatters';
import { Icon } from '../../Icon';

interface AnomalyCardProps {
  anomaly: AnomalyItem;
  onInvestigate: (id: string) => void;
  onTicket: (id: string) => void;
  onResolve: (id: string) => void;
}

const severityBorderColors: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-400',
  info: 'border-l-gray-400',
};

const severityBadgeColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
  info: 'bg-gray-100 text-gray-700',
};

export default function AnomalyCard({ anomaly, onInvestigate, onTicket, onResolve }: AnomalyCardProps) {
  const borderClass = severityBorderColors[anomaly.severity] ?? 'border-l-gray-300';
  const badgeClass = severityBadgeColors[anomaly.severity] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 border-l-4 ${borderClass}`}>
      <div className="flex items-start gap-4">
        {/* Severity badge */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${badgeClass}`}>
          {getSeverityLabel(anomaly.severity)}
        </span>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-gray-900 truncate">{anomaly.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{anomaly.description}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {getCorridorLabel(anomaly.corridor)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-50 text-gray-700 border border-gray-200">
              {anomaly.reference}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
              {anomaly.impactLabel}
            </span>
            <span className="text-xs text-gray-400">              {new Date(anomaly.detectedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
            {anomaly.partnerName && (
              <span className="flex items-center gap-1">
                <Icon name="building" className="w-3.5 h-3.5" />
                {anomaly.partnerName}
              </span>
            )}
            {anomaly.clientName && (
              <span className="flex items-center gap-1">
                <Icon name="user" className="w-3.5 h-3.5" />
                {anomaly.clientName}
              </span>
            )}
            {anomaly.driverName && (
              <span className="flex items-center gap-1">
                <Icon name="truck" className="w-3.5 h-3.5" />
                {anomaly.driverName}
              </span>
            )}
          </div>

          {anomaly.detectionConfidence !== undefined && (
            <div className="mt-2">
              <span
                className={`text-xs font-semibold ${anomaly.detectionConfidence >= 90 ? 'text-green-600' : anomaly.detectionConfidence >= 75 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {anomaly.detectionConfidence}% confiance
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => onInvestigate(anomaly.id)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Investiguer
          </button>
          <button
            onClick={() => onTicket(anomaly.id)}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Créer ticket
          </button>
          <button
            onClick={() => onResolve(anomaly.id)}
            className="px-3 py-1.5 text-xs font-medium text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
          >
            Résoudre
          </button>
        </div>
      </div>
    </div>
  );
}
