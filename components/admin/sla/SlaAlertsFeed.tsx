import { Icon } from '../../Icon';
import type { SlaAlert } from '../../../lib/admin/sla-types';

const severityStyle = (s: string) =>
  s === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : s === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-blue-700';

export function SlaAlertsFeed({ alerts }: { alerts: SlaAlert[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="bell" className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-900">Alertes SLA ({alerts.length})</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-bold">LIVE</span>
        </div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.map((a) => (
          <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${severityStyle(a.severity)}`}>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{a.time}</span>
            <p className="flex-1 font-medium">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
