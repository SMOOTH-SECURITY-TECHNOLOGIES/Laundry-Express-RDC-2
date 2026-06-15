import type { DisputeAnomaly } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface DisputeAnomaliesCardProps {
  anomalies: DisputeAnomaly[];
  onViewAll?: () => void;
}

const anomalyIcons: Record<string, React.ReactNode> = {
  default: <Icon name="warning" className="w-4 h-4" />,
};

const anomalyColors: Record<string, string> = {
  'Fréquence inhabituelle': '#ef4444',
  'Montant atypique': '#f59e0b',
  'Pattern temporel': '#8b5cf6',
  'Corrélation client': '#3b82f6',
  'Doublon suspect': '#ec4899',
};

export function DisputeAnomaliesCard({ anomalies, onViewAll }: DisputeAnomaliesCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Anomalies détectées
        </h3>
        <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
          {anomalies.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {anomalies.map((anomaly) => {
          const color = anomalyColors[anomaly.name] || '#6b7280';
          return (
            <div
              key={anomaly.name}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}15` }}
              >
                <span style={{ color }}>{anomalyIcons.default}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-700 truncate block">
                  {anomaly.name}
                </span>
              </div>
              <span
                className="text-sm font-bold px-2.5 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {anomaly.count}
              </span>
            </div>
          );
        })}
      </div>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-4 w-full text-sm font-semibold text-blue-600 hover:underline"
        >
          Voir toutes les anomalies
        </button>
      )}
    </div>
  );
}
