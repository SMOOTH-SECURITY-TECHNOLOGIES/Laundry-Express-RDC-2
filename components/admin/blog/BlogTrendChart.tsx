import type { BlogTrend } from '../../../lib/admin/blog-types';

export function BlogTrendChart({ trends }: { trends: BlogTrend[] }) {
  const max = Math.max(...trends.map((t) => t.views), 1);
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Performance du blog (30j)</h3>
      <div className="flex items-end gap-1 h-32">
        {trends.slice(-30).map((t) => (
          <div key={t.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${t.date}: ${t.views} vues`}>
            <div className="w-full bg-blue-500 rounded-t opacity-80" style={{ height: `${(t.views / max) * 100}%`, minHeight: t.views ? 4 : 0 }} />
            {trends.length <= 15 && <span className="text-[8px] text-gray-400 rotate-45 origin-left">{t.date}</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded" />Vues</span></div>
    </div>
  );
}
