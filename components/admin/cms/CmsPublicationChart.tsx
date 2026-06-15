import type { CmsPublicationStatus } from '../../../lib/admin/cms-types';

export function CmsPublicationChart({ data }: { data: CmsPublicationStatus[] }) {
  const total = data.reduce((a, d) => a + d.count, 0) || 1;
  let offset = 0;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">États de publication</h3>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
          {data.map((s) => {
            const pct = s.count / total * 100;
            const seg = <circle key={s.status} cx="18" cy="18" r="15.9" fill="none" stroke={s.color} strokeWidth="3.2" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset + 25} />;
            offset += pct;
            return seg;
          })}
        </svg>
        <div className="space-y-2 flex-1">
          {data.map((s) => (
            <div key={s.status} className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <span>{s.count} ({s.percent}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
