import type { RootCauseItem } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface RootCausesCardProps {
  causes: RootCauseItem[];
}

export function RootCausesCard({ causes }: RootCausesCardProps) {
  return (
    <div className="flex flex-col gap-3">
      {causes.map((cause) => (
        <div key={cause.name} className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: `${cause.color}20` }}
          >
            <Icon name={cause.icon as any} className="h-4 w-4" style={{ color: cause.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 truncate">{cause.name}</span>
              <span className="text-sm font-semibold text-slate-800 ml-2">{cause.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${cause.percentage}%`,
                  backgroundColor: cause.color,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
