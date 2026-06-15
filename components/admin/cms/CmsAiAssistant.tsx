import type { CmsAiSuggestion } from '../../../lib/admin/cms-types';
import { Icon } from '../../Icon';

export function CmsAiAssistant({ suggestions }: { suggestions: CmsAiSuggestion[] }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-purple-700 uppercase mb-4 flex items-center gap-2"><Icon name="sparkles" className="w-4 h-4" /> Contenu IA Assistant</h3>
      {suggestions.length === 0 ? <p className="text-sm text-gray-500">Aucune suggestion pour le moment.</p> : (
        <ul className="space-y-2">
          {suggestions.map((s) => (
            <li key={s.id} className="bg-white/80 rounded-lg p-3 text-sm border border-purple-100">{s.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
