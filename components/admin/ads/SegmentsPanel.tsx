import { Icon } from '../../Icon';
import type { AdSegment } from '../../../lib/admin/ads-types';

export function SegmentsPanel({ segments }: { segments: AdSegment[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="users" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Audience Builder</h3>
      </div>
      <div className="space-y-3">
        {segments.map((s) => (
          <div key={s.segmentKey} className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-900 dark:text-slate-100">{s.segment}</span>
            <span className="text-gray-500">{s.clients.toLocaleString('fr-FR')} clients</span>
            <span className="font-bold text-blue-600">{s.percent}%</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-gray-400">Combinez des règles (ex: commandes &gt; 3 + inactif 30j) pour cibler précisément.</p>
    </div>
  );
}
