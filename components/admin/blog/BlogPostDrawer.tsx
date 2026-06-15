import { BLOG_WRITE_ENABLED } from '../../../lib/admin/blog-api';
import type { BlogPostDetail } from '../../../lib/admin/blog-types';
import { Icon } from '../../Icon';

export function BlogPostDrawer({ post, loading, onClose, onPublish, onSeoAudit }: {
  post: BlogPostDetail | null; loading?: boolean; onClose: () => void;
  onPublish: () => void; onSeoAudit: () => void;
}) {
  if (!post && !loading) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl h-full overflow-y-auto p-6">
        {loading ? <div className="animate-pulse h-40 bg-gray-100 rounded" /> : post && (
          <>
            <div className="flex justify-between mb-4">
              <div><h2 className="text-lg font-bold">{post.title}</h2><p className="text-sm text-gray-500">{post.statusLabel} • SEO {post.seoScore}</p></div>
              <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{post.excerpt}</p>
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap mb-6">{post.content.slice(0, 800)}...</div>
            {BLOG_WRITE_ENABLED && (
              <div className="flex gap-2">
                {post.status !== 'published' && <button type="button" onClick={onPublish} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Publier</button>}
                <button type="button" onClick={onSeoAudit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Audit SEO</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
