import type { BlogSeoBucket } from '../../../lib/admin/blog-types';

export function BlogSeoChart({ data, avgScore }: { data: BlogSeoBucket[]; avgScore: number }) {
  let offset = 0;
  const total = data.reduce((a, d) => a + d.count, 0) || 1;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Aperçu SEO</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {data.map((s) => {
              const pct = s.count / total * 100;
              const el = <circle key={s.label} cx="18" cy="18" r="15.9" fill="none" stroke={s.color} strokeWidth="3.2" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset + 25} />;
              offset += pct;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{avgScore}</span>
            <span className="text-[10px] text-gray-500">moyenne</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-sm">
          {data.map((s) => <div key={s.label} className="flex justify-between"><span>{s.label}</span><span>{s.count} ({s.percent}%)</span></div>)}
        </div>
      </div>
    </div>
  );
}
