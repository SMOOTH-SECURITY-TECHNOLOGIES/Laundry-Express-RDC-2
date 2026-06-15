import { Icon } from '../../Icon';

export function CmsQuickActions({ onNewPage }: { onNewPage: () => void }) {
  const actions = [
    { label: 'Nouvelle section', icon: 'plus' as const },
    { label: 'Ajouter une FAQ', icon: 'question-mark-circle' as const },
    { label: 'Téléverser un média', icon: 'photo' as const },
    { label: 'Voir les révisions', icon: 'clock-history' as const },
  ];
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Actions rapides</h3>
      <ul className="space-y-2">
        <li><button type="button" onClick={onNewPage} className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 text-sm font-medium text-purple-700 flex items-center gap-2"><Icon name="plus" className="w-4 h-4" /> Nouvelle page</button></li>
        {actions.map((a) => (
          <li key={a.label}><button type="button" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"><Icon name={a.icon} className="w-4 h-4 text-gray-400" />{a.label}</button></li>
        ))}
      </ul>
    </div>
  );
}
