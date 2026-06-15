import { Icon } from '../../Icon';
import type { LoyaltySegment } from '../../../lib/admin/loyalty-types';

export function LoyaltySegmentsCard({ segments }: { segments: LoyaltySegment[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Segments</h3></div>
      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.segmentKey} className="flex items-center justify-between text-xs">
            <span className="font-medium">{s.segment}</span>
            <span className="text-gray-500">{s.count.toLocaleString('fr-FR')}</span>
            <span className="font-bold text-purple-600">{s.percent}%</span>
            <button type="button" className="text-[10px] text-blue-600 hover:underline">Action</button>
          </div>
        ))}
      </div>
    </div>
  );
}
