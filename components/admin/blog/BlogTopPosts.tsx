import type { BlogTopPost } from '../../../lib/admin/blog-types';

export function BlogTopPosts({ posts }: { posts: BlogTopPost[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Articles les plus performants</h3>
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="text-left py-2">Titre</th><th className="text-right py-2">Vues</th><th className="text-right py-2">CTR</th><th className="text-right py-2">Leads</th><th className="text-right py-2">SEO</th></tr></thead>
        <tbody className="divide-y">
          {posts.map((p) => (
            <tr key={p.postId}><td className="py-2 max-w-[140px] truncate">{p.title}</td><td className="text-right">{p.views.toLocaleString('fr-FR')}</td><td className="text-right">{p.ctr}%</td><td className="text-right">{p.leads}</td><td className="text-right font-semibold">{p.seoScore}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
