import { Icon } from '../../Icon';

const actions = [
  { label: 'Envoyer message', icon: 'paper-plane' as const },
  { label: 'Créer template', icon: 'document-text' as const },
  { label: 'Créer campagne', icon: 'chartBar' as const },
  { label: 'Tester webhook', icon: 'code-bracket' as const },
  { label: 'Export conversations', icon: 'arrow-down-tray' as const },
  { label: 'Ouvrir analytics', icon: 'chartBar' as const },
];

export function QuickActionsPanel({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Actions rapides</h3>
      <div className="space-y-2">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={() => onAction(a.label)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-left">
            <Icon name={a.icon} className="w-4 h-4 text-gray-500" />{a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
