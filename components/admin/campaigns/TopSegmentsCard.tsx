import { Icon } from '../../Icon';
import type { CampaignSegment } from '../../../lib/admin/campaigns-types';

export function TopSegmentsCard({ segments }: { segments: CampaignSegment[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-violet-600" /><h3 className="text-sm font-semibold">Top segments</h3></div>
      <div className="space-y-2">{segments.map((s) => (
        <div key={s.segmentKey} className="flex justify-between text-xs border-b pb-2">
          <div><p className="font-medium">{s.segment}</p><p className="text-gray-400">{s.audienceSize.toLocaleString('fr-FR')} utilisateurs</p></div>
          <div className="text-right"><p className="font-bold text-green-600">{s.conversionRate}%</p><p>{s.revenue.toLocaleString('fr-FR')} $</p></div>
        </div>
      ))}</div>
    </div>
  );
}
