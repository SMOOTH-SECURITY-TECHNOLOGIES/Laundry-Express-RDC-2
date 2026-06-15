import { Icon } from '../../Icon';

const ACTIONS = [
  { id: 'rule', label: 'Créer règle SLA', icon: 'plus' as const },
  { id: 'export', label: 'Exporter rapport', icon: 'arrow-down-tray' as const },
  { id: 'critical-orders', label: 'Voir commandes critiques', icon: 'exclamation-circle' as const },
  { id: 'critical-drivers', label: 'Voir chauffeurs critiques', icon: 'truck' as const },
  { id: 'critical-partners', label: 'Voir partenaires critiques', icon: 'users' as const },
  { id: 'cockpit', label: 'Ouvrir Cockpit', icon: 'map' as const },
];

export function SlaQuickActions({ onAction }: { onAction: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button key={a.id} type="button" onClick={() => onAction(a.id)} className="flex items-center gap-2 p-3 rounded-xl border border-purple-200 text-purple-700 text-xs font-medium hover:bg-purple-50 transition-colors">
            <Icon name={a.icon} className="w-4 h-4" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
