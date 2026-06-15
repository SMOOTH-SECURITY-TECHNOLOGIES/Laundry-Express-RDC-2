import { useState } from 'react';

const exportFormats = [
  { key: 'pdf', label: 'PDF', icon: 'document-text' },
  { key: 'excel', label: 'Excel', icon: 'document-arrow-down' },
  { key: 'csv', label: 'CSV', icon: 'arrow-down-tray' },
  { key: 'json', label: 'JSON', icon: 'code-bracket' },
] as const;

const filterCategories = [
  { key: 'finance', label: 'Finance' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'logistics', label: 'Logistique' },
  { key: 'subscriptions', label: 'Abonnements' },
] as const;

const iconPaths: Record<string, React.ReactNode> = {
  'document-text': <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  'document-arrow-down': <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  'arrow-down-tray': <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />,
  'code-bracket': <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12" />,
};

export function ExportCenter() {
  const [selected, setSelected] = useState<string[]>(['subscriptions']);

  const toggleFilter = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExport = (format: string) => {
    window.dispatchEvent(
      new CustomEvent('admin-subscriptions-export', { detail: { format, filters: selected } })
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Centre d'export</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {exportFormats.map((f) => (
          <button
            key={f.key}
            onClick={() => handleExport(f.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
              {iconPaths[f.icon]}
            </svg>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {filterCategories.map((cat) => (
          <label key={cat.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={selected.includes(cat.key)}
              onChange={() => toggleFilter(cat.key)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {cat.label}
          </label>
        ))}
      </div>
    </div>
  );
}
