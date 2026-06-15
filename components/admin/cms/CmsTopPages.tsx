import type { CmsTopPage } from '../../../lib/admin/cms-types';

export function CmsTopPages({ pages }: { pages: CmsTopPage[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Pages les plus visitées</h3>
      <div className="space-y-3">
        {pages.map((p) => (
          <div key={p.pageId}>
            <div className="flex justify-between text-sm mb-1"><span className="font-medium truncate">{p.title}</span><span>{p.views.toLocaleString('fr-FR')}</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.percent}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
