import type { BlogPostItem } from '../../../lib/admin/blog-types';
import { Icon } from '../../Icon';

const STATUS: Record<string, string> = {
  published: 'bg-green-100 text-green-700', draft: 'bg-amber-100 text-amber-700',
  review: 'bg-violet-100 text-violet-700', scheduled: 'bg-blue-100 text-blue-700',
};

export function BlogPostsTable({ posts, onView }: { posts: BlogPostItem[]; onView: (p: BlogPostItem) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex justify-between"><h2 className="text-sm font-bold uppercase">Tous les articles</h2><span className="text-xs text-gray-500">{posts.length}</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-xs text-gray-500 uppercase">
            <th className="text-left px-4 py-3">Article</th><th className="text-left px-4 py-3">Auteur</th>
            <th className="text-left px-4 py-3">Catégorie</th><th className="text-left px-4 py-3">Statut</th>
            <th className="text-center px-4 py-3">SEO</th><th className="text-right px-4 py-3">Vues</th>
            <th className="text-right px-4 py-3">Com.</th><th className="text-right px-4 py-3">Action</th>
          </tr></thead>
          <tbody className="divide-y">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium max-w-[200px] truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">/blog/{p.slug}</p>
                </td>
                <td className="px-4 py-3">{p.authorName}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs" style={{ background: `${p.categoryColor}22`, color: p.categoryColor }}>{p.category}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS[p.status] ?? ''}`}>{p.statusLabel}</span></td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold ${p.seoScore >= 80 ? 'bg-green-100 text-green-700' : p.seoScore >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{p.seoScore}</span></td>
                <td className="px-4 py-3 text-right">{p.viewsCount.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right">{p.commentsCount}</td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => onView(p)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Icon name="pencil" className="w-4 h-4 text-gray-500" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
