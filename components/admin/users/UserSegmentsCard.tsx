import { Icon } from '../../Icon';
import type { UserSegment } from '../../../lib/admin/users-types';

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

export function UserSegmentsCard({ segments }: { segments: UserSegment[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="users" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold">Segmentation</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map((s, i) => (
          <div key={s.segmentKey} className="px-3 py-2 rounded-xl border text-xs" style={{ borderColor: COLORS[i % COLORS.length] }}>
            <p className="font-semibold">{s.segment}</p>
            <p className="text-gray-500 mt-0.5">{s.count} ({s.percent}%)</p>
          </div>
        ))}
      </div>
    </div>
  );
}
