import type { BlogAiSuggestion } from '../../../lib/admin/blog-types';
import { Icon } from '../../Icon';

export function BlogAiSuggestions({ suggestions }: { suggestions: BlogAiSuggestion[] }) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
      <h3 className="text-sm font-semibold text-indigo-700 uppercase mb-4 flex items-center gap-2"><Icon name="sparkles" className="w-4 h-4" /> Suggestions IA</h3>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li key={s.id} className="bg-white/80 rounded-lg p-3 text-sm border border-indigo-100">
            <span className="text-[10px] uppercase text-indigo-500 font-semibold">{s.category}</span>
            <p className="mt-1">{s.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
