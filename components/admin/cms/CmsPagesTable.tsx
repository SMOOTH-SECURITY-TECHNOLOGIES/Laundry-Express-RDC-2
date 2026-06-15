import type { CmsPageItem } from '../../../lib/admin/cms-types';
import { Icon } from '../../Icon';

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700', draft: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-blue-100 text-blue-700', review: 'bg-violet-100 text-violet-700',
};

export function CmsPagesTable({ pages, onView }: { pages: CmsPageItem[]; onView: (p: CmsPageItem) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b"><h2 className="text-sm font-bold uppercase">Toutes les pages</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">Page</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Langue</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Mise à jour</th>
              <th className="text-right px-4 py-3">Vues (7j)</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.slug}</p>
                </td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{p.pageTypeLabel}</span></td>
                <td className="px-4 py-3 uppercase text-xs">{p.language}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? ''}`}>{p.statusLabel}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.updatedAt ? new Date(p.updatedAt).toLocaleString('fr-FR') : '—'}</td>
                <td className="px-4 py-3 text-right">{p.views7d.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => onView(p)} className="p-1.5 rounded-lg hover:bg-gray-100"><Icon name="pencil" className="w-4 h-4 text-gray-500" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
