import { Icon } from '../../Icon';

export function BlogQuickActions({ onNewPost, onAiGenerate }: { onNewPost: () => void; onAiGenerate: () => void }) {
  const actions = [
    { label: 'Générer avec IA', icon: 'sparkles' as const, onClick: onAiGenerate },
    { label: 'Importer Markdown', icon: 'document-arrow-down' as const },
    { label: 'Calendrier éditorial', icon: 'calendar' as const },
    { label: 'Audit SEO', icon: 'badge-check' as const },
    { label: 'Médiathèque', icon: 'photo' as const },
  ];
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Actions rapides</h3>
      <ul className="space-y-2">
        <li><button type="button" onClick={onNewPost} className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium flex items-center gap-2"><Icon name="plus" className="w-4 h-4" />Nouvel article</button></li>
        {actions.map((a) => (
          <li key={a.label}><button type="button" onClick={a.onClick} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"><Icon name={a.icon} className="w-4 h-4 text-gray-400" />{a.label}</button></li>
        ))}
      </ul>
    </div>
  );
}
