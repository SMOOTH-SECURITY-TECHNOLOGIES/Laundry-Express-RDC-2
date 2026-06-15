import { Icon } from '../../Icon';

const ACTIONS = [
  { id: 'add', label: 'Ajouter zone', icon: 'plus' as const },
  { id: 'tariffs', label: 'Modifier tarifs', icon: 'currencyDollar' as const },
  { id: 'limits', label: 'Définir limites', icon: 'map' as const },
  { id: 'saturated', label: 'Voir zones saturées', icon: 'exclamation-circle' as const },
  { id: 'risk', label: 'Gérer zones à risque', icon: 'warning' as const },
  { id: 'export', label: 'Exporter rapport', icon: 'arrow-down-tray' as const },
];

export function ZoneQuickActions({ onAction }: { onAction: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button key={a.id} type="button" onClick={() => onAction(a.id)} className="flex items-center gap-2 p-3 rounded-xl border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-50 transition-colors">
            <Icon name={a.icon} className="w-4 h-4" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
