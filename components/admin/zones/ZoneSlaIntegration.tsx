import { Icon } from '../../Icon';
import type { ZoneSlaSummary } from '../../../lib/admin/zones-types';

export function ZoneSlaIntegration({ summary, onOpenSlaCenter }: { summary: ZoneSlaSummary; onOpenSlaCenter: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="shield-check" className="w-5 h-5 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-900">SLA Center</h3>
        </div>
        <button type="button" onClick={onOpenSlaCenter} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Voir SLA Center →</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-green-50 p-3 text-center"><p className="text-[10px] text-gray-500">SLA moyen</p><p className="text-2xl font-bold text-green-600">{summary.avgSla}%</p></div>
        <div className="rounded-xl bg-orange-50 p-3 text-center"><p className="text-[10px] text-gray-500">SLA critique</p><p className="text-2xl font-bold text-orange-600">{summary.criticalZones}</p></div>
        <div className="rounded-xl bg-red-50 p-3 text-center"><p className="text-[10px] text-gray-500">Zones dépassées</p><p className="text-2xl font-bold text-red-600">{summary.breachedZones}</p></div>
      </div>
    </div>
  );
}
