import { Icon } from '../../Icon';
import type { ZoneDispatcherSnapshot } from '../../../lib/admin/zones-types';

export function ZoneDispatcherIntegration({ snapshots, onOpenDispatcher }: { snapshots: ZoneDispatcherSnapshot[]; onOpenDispatcher: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="computer" className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Cockpit Dispatcher</h3>
        </div>
        <button type="button" onClick={onOpenDispatcher} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Ouvrir →</button>
      </div>
      <div className="space-y-3">
        {snapshots.map((s) => (
          <div key={s.zone} className="p-3 rounded-xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{s.zone}</p>
            <div className="grid grid-cols-4 gap-2 mt-2 text-center text-[10px]">
              <div><p className="text-gray-400">Chauffeurs</p><p className="font-bold text-green-600">{s.driversAvailable}</p></div>
              <div><p className="text-gray-400">Collectes</p><p className="font-bold text-orange-600">{s.pickups}</p></div>
              <div><p className="text-gray-400">Livraisons</p><p className="font-bold text-violet-600">{s.deliveries}</p></div>
              <div><p className="text-gray-400">Incidents</p><p className="font-bold text-red-600">{s.incidents}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
