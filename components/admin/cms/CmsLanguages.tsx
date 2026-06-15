import type { CmsLanguage } from '../../../lib/admin/cms-types';

const FLAGS: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧', sw: '🇹🇿', ln: '🇨🇩' };

export function CmsLanguages({ languages }: { languages: CmsLanguage[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Langues actives</h3>
      <ul className="space-y-2">
        {languages.map((l) => (
          <li key={l.language} className="flex justify-between text-sm">
            <span>{FLAGS[l.language] ?? ''} {l.label}</span>
            <span className="font-medium">{l.pageCount} pages</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
