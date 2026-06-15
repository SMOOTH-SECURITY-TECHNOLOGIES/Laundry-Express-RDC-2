import { Icon } from '../../Icon';
import type { ZoneTruthAnomaly } from '../../../lib/admin/zones-types';

export function ZoneTruthIntegration({ anomalies, onOpenTruth }: { anomalies: ZoneTruthAnomaly[]; onOpenTruth: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="shield" className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Truth Dashboard — Anomalies</h3>
        </div>
        <button type="button" onClick={onOpenTruth} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Voir →</button>
      </div>
      <div className="space-y-2">
        {anomalies.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
            <div>
              <p className="text-sm font-medium text-gray-900">{a.zone}</p>
              <p className="text-xs text-gray-500">{a.title}</p>
            </div>
            <span className="text-lg font-bold text-red-600">{a.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
