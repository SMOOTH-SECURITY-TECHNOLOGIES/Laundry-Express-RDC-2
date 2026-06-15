import { Icon } from '../../Icon';
import type { ZoneAlert } from '../../../lib/admin/zones-types';

const SEV: Record<string, string> = { critical: 'bg-red-100 text-red-700', warning: 'bg-orange-100 text-orange-700', info: 'bg-blue-100 text-blue-700' };

export function ZoneAlertsCard({ alerts }: { alerts: ZoneAlert[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="warning" className="w-5 h-5 text-orange-600" />
        <h3 className="text-sm font-semibold text-gray-900">Alertes zones</h3>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">{a.zone} — {a.title}</p>
              <p className="text-xs text-gray-500">{a.detail}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SEV[a.severity]}`}>{a.severityLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
