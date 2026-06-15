import { Icon } from '../../Icon';
import type { SlaDispatcherSnapshot } from '../../../lib/admin/sla-types';

export function SlaDispatcherIntegration({ snapshot, onOpenCockpit }: { snapshot: SlaDispatcherSnapshot; onOpenCockpit: () => void }) {
  const items = [
    { label: 'Missions ouvertes', value: snapshot.openMissions, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Chauffeurs disponibles', value: snapshot.availableDrivers, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Chauffeurs saturés', value: snapshot.saturatedDrivers, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="truck" className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Cockpit Dispatcher — Temps réel</h3>
        </div>
        <button type="button" onClick={onOpenCockpit} className="text-xs text-blue-600 font-medium">Ouvrir Cockpit →</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((i) => (
          <div key={i.label} className={`rounded-xl ${i.bg} border border-gray-100 p-3 text-center`}>
            <p className={`text-xl font-bold ${i.color}`}>{i.value}</p>
            <p className="text-[10px] text-gray-500 mt-1">{i.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
