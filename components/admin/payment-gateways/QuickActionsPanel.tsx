import { Icon } from '../../Icon';

const actions = ['Réconciliation', 'Export comptable', 'Voir incidents', 'Configurer passerelle', 'Tester webhook', 'Voir settlements'];

export function QuickActionsPanel({ onAction }: { onAction: (a: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Actions rapides</h3>
      <div className="space-y-2">
        {actions.map((a) => (
          <button key={a} type="button" onClick={() => onAction(a)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50 text-left">
            <Icon name="check" className="w-4 h-4 text-blue-600" />{a}
          </button>
        ))}
      </div>
    </div>
  );
}
