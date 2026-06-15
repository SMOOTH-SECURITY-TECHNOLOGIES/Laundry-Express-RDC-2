import { CMS_WRITE_ENABLED } from '../../../lib/admin/cms-api';
import type { CmsPageDetail } from '../../../lib/admin/cms-types';
import { Icon } from '../../Icon';

export function CmsPageDrawer({ page, loading, onClose, onPublish }: {
  page: CmsPageDetail | null; loading?: boolean; onClose: () => void; onPublish: () => void;
}) {
  if (!page && !loading) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl h-full overflow-y-auto p-6">
        {loading ? <div className="animate-pulse space-y-4"><div className="h-6 bg-gray-100 rounded" /><div className="h-32 bg-gray-100 rounded" /></div> : page && (
          <>
            <div className="flex justify-between items-start mb-6">
              <div><h2 className="text-lg font-bold">{page.title}</h2><p className="text-sm text-gray-500">{page.slug} • {page.statusLabel}</p></div>
              <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
            </div>
            {page.description && <p className="text-sm text-gray-600 mb-4">{page.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-gray-500">SEO</span><p className="font-medium">{page.seoScore}/100</p></div>
              <div><span className="text-gray-500">Vues 7j</span><p className="font-medium">{page.views7d}</p></div>
            </div>
            {page.sections.length > 0 && (
              <div className="mb-4"><p className="text-xs uppercase text-gray-500 mb-2">Sections</p>
                <ul className="space-y-1 text-sm">{page.sections.map((s, i) => <li key={i} className="bg-gray-50 rounded p-2">{(s.type as string) || 'section'} — {(s.title as string) || ''}</li>)}</ul>
              </div>
            )}
            {page.faqs.length > 0 && (
              <div className="mb-4"><p className="text-xs uppercase text-gray-500 mb-2">FAQ ({page.faqs.length})</p></div>
            )}
            {CMS_WRITE_ENABLED && page.status !== 'published' && (
              <button type="button" onClick={onPublish} className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium">Publier</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
