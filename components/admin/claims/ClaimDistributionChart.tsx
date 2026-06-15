import type { ClaimDistribution } from '../../../lib/admin/claims-types';

export function ClaimDistributionChart({ data, total }: { data: ClaimDistribution[]; total: number }) {
  const sum = data.reduce((a, d) => a + d.count, 0) || total || 1;
  let offset = 0;
  const segments = data.map((d) => {
    const pct = d.count / sum * 100;
    const seg = { ...d, pct, offset };
    offset += pct;
    return seg;
  });
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Répartition des réclamations</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {segments.map((s) => (
              <circle key={s.category} cx="18" cy="18" r="15.9" fill="none" stroke={s.color} strokeWidth="3.2"
                strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={-s.offset + 25} />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{sum}</span>
            <span className="text-[10px] text-gray-500">total</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.category}</div>
              <span className="font-medium">{d.count} ({d.percent}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
