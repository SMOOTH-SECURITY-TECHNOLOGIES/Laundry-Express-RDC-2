import { Icon } from '../../Icon';

const ACTIONS = [
  { id: 'add', label: 'Ajouter chauffeur', icon: 'plus' as const, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { id: 'critical', label: 'Voir chauffeurs critiques', icon: 'warning' as const, color: 'bg-red-50 text-red-700 hover:bg-red-100' },
  { id: 'dispatch', label: 'Auto Dispatch', icon: 'fire' as const, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { id: 'investigate', label: 'Investigate anomalies', icon: 'magnifying-glass-plus' as const, color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
  { id: 'export', label: 'Exporter chauffeurs', icon: 'arrow-down-tray' as const, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { id: 'settings', label: 'Paramètres chauffeurs', icon: 'settings' as const, color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
];

export function DriverQuickActions({ onAction }: { onAction: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button key={a.id} type="button" onClick={() => onAction(a.id)} className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-colors ${a.color}`}>
            <Icon name={a.icon} className="w-4 h-4" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
