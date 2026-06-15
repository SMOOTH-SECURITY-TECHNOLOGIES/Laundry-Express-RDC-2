import { Icon } from '../../Icon';
import type { DriverIncident } from '../../../lib/admin/drivers-types';

const PRIO: Record<string, string> = { critical: 'bg-red-100 text-red-700', major: 'bg-orange-100 text-orange-700', minor: 'bg-yellow-100 text-yellow-700' };

export function DriverIncidentCenter({ incidents, onInvestigate }: { incidents: DriverIncident[]; onInvestigate: (i: DriverIncident) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="warning" className="w-5 h-5 text-red-600" />
        <h3 className="text-sm font-semibold text-gray-900">Incidents récents</h3>
      </div>
      <div className="space-y-2">
        {incidents.slice(0, 5).map((inc) => (
          <div key={inc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium">{inc.title}</p>
              <p className="text-[10px] text-gray-400">{inc.driverName} · {inc.createdAt}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIO[inc.priority]}`}>{inc.priorityLabel}</span>
              <button type="button" onClick={() => onInvestigate(inc)} className="text-[10px] px-2 py-1 rounded-lg bg-gray-900 text-white hover:bg-gray-800">Investigate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
