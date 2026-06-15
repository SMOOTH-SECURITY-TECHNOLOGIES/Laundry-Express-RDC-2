import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { realApi } from '../services/real-api';

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorAvatar?: string | null;
  category: string;
  categoryColor: string;
  readingTime: number;
  viewsCount: number;
  publishedAt?: string | null;
  featuredImage?: string | null;
};

type BlogPostDetail = BlogPost & {
  content: string;
  tags: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const BlogPage: React.FC = () => {
  const { activeBlogSlug, setActiveBlogSlug, navigate } = useAppContext();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [detail, setDetail] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeBlogSlug) {
          const raw = await realApi.getPublicBlogPost(activeBlogSlug);
          if (cancelled) return;
          setDetail({
            id: raw.id,
            slug: raw.slug,
            title: raw.title,
            excerpt: raw.excerpt,
            authorName: raw.author_name,
            authorAvatar: raw.author_avatar,
            category: raw.category,
            categoryColor: raw.category_color,
            readingTime: raw.reading_time,
            viewsCount: raw.views_count,
            publishedAt: raw.published_at,
            featuredImage: raw.featured_image,
            content: raw.content,
            tags: raw.tags ?? [],
            seoTitle: raw.seo_title,
            seoDescription: raw.seo_description,
          });
          setPosts([]);
          document.title = `${raw.seo_title || raw.title} | Laundry Express`;
        } else {
          const raw = await realApi.getPublicBlogPosts();
          if (cancelled) return;
          setPosts(
            raw.posts.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              excerpt: p.excerpt,
              authorName: p.author_name,
              authorAvatar: p.author_avatar,
              category: p.category,
              categoryColor: p.category_color,
              readingTime: p.reading_time,
              viewsCount: p.views_count,
              publishedAt: p.published_at,
              featuredImage: p.featured_image,
            })),
          );
          setDetail(null);
          document.title = 'Blog | Laundry Express';
        }
      } catch {
        if (!cancelled) {
          setError(activeBlogSlug ? 'Article introuvable.' : 'Impossible de charger le blog.');
          setDetail(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [activeBlogSlug]);

  const openPost = (slug: string) => {
    setActiveBlogSlug(slug);
    navigate(`/blog/${slug}`);
  };

  const backToList = () => {
    setActiveBlogSlug(null);
    navigate('/blog');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
          <Icon name="warning" className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-brand-dark dark:text-slate-100 mb-2">Blog indisponible</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
          <button
            type="button"
            onClick={backToList}
            className="px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold"
          >
            Retour au blog
          </button>
        </div>
      </div>
    );
  }

  if (detail) {
    return (
      <article className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <button type="button" onClick={backToList} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue mb-6">
            <Icon name="arrowLeft" className="w-4 h-4" />
            Retour aux articles
          </button>

          <div className="mb-4">
            <span
              className="inline-flex px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: detail.categoryColor }}
            >
              {detail.category}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark dark:text-slate-100 mb-4">{detail.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-8">
            <span>{detail.authorName}</span>
            <span>{formatDate(detail.publishedAt)}</span>
            <span>{detail.readingTime} min de lecture</span>
            <span>{detail.viewsCount.toLocaleString('fr-FR')} vues</span>
          </div>

          {detail.featuredImage && (
            <img src={detail.featuredImage} alt={detail.title} className="w-full h-64 md:h-80 object-cover rounded-2xl mb-8" />
          )}

          <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap text-slate-700 dark:text-slate-200 leading-relaxed">
            {detail.content}
          </div>

          {detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {detail.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-200">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark dark:text-slate-100">Blog Laundry Express</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-2xl mx-auto">
            Conseils, guides et actualités sur la blanchisserie, la logistique et le marketplace à Kinshasa.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10">
            <Icon name="document-text" className="w-10 h-10 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300">Aucun article publié pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => openPost(post.slug)}
                className="text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {post.featuredImage && (
                  <img src={post.featuredImage} alt={post.title} className="w-full h-44 object-cover" />
                )}
                <div className="p-5">
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold text-white mb-3"
                    style={{ backgroundColor: post.categoryColor }}
                  >
                    {post.category}
                  </span>
                  <h2 className="text-lg font-bold text-brand-dark dark:text-slate-100 mb-2">{post.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>{post.readingTime} min</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
