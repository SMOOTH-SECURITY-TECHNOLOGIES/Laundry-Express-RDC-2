import { AnomalyActivityEvent } from '../../../lib/admin/anomalies-types';
import { getSeverityLabel } from '../../../lib/admin/anomalies-formatters';

interface AnomalyActivityFeedProps {
  events: AnomalyActivityEvent[];
}

const severityDotColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
  info: 'bg-gray-400',
};

export default function AnomalyActivityFeed({ events }: AnomalyActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-900">
          Activité temps réel
        </h3>
        <a href="#" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Voir tout
        </a>
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune activité récente.</p>
        )}

        {events.map((event) => {
          const dotColor = severityDotColors[event.severity] ?? 'bg-gray-400';
          return (
            <div key={event.id} className="flex items-start gap-3">
              {/* Severity dot */}
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

              <div className="flex-1 min-w-0">
                {/* Time + Title */}
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono font-bold text-gray-900 whitespace-nowrap">
                    {event.time}
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {event.title}
                  </span>
                </div>

                {/* Reference + Partner/Driver */}
                <div className="flex items-center gap-2 mt-0.5">
                  {event.reference && (
                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      {event.reference}
                    </span>
                  )}
                  {event.partner && (
                    <span className="text-xs text-gray-500">{event.partner}</span>
                  )}
                  {event.partner && (
                    <span className="text-xs text-gray-500">{event.partner}</span>
                  )}
                </div>

                {/* Severity badge */}
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {getSeverityLabel(event.severity)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
