import type { BlogCategory, BlogTag } from '../../../lib/admin/blog-types';

export function BlogSidebar({ categories, tags }: { categories: BlogCategory[]; tags: BlogTag[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Catégories</h3>
        <ul className="space-y-2 text-sm">
          {categories.map((c) => (
            <li key={c.id} className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}</span><span className="text-gray-400">{c.postCount}</span></li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Tags populaires</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => <span key={t.id} className="px-2 py-1 bg-gray-100 rounded-lg text-xs">{t.name}</span>)}
        </div>
      </div>
    </div>
  );
}
