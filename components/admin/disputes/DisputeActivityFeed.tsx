import type { DisputeActivityEvent } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface DisputeActivityFeedProps {
  events: DisputeActivityEvent[];
}

const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export function DisputeActivityFeed({ events }: DisputeActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Activité récente
      </h3>

      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

        <div className="flex flex-col gap-4">
          {events.map((event) => {
            const colors = colorMap[event.color] || colorMap.gray;
            return (
              <div key={event.id} className="flex items-start gap-3 relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${colors.bg}`}
                >
                  <Icon name={event.icon as any} className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {event.action}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{event.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{event.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
