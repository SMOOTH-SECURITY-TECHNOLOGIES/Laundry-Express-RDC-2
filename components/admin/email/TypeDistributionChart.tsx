import type { TypeDistribution } from '../../../lib/admin/email-types';

export function TypeDistributionChart({ data, total }: { data: TypeDistribution[]; total: number }) {
  let acc = 0;
  const slices = data.map((d) => { const start = (acc / 100) * 360; acc += d.percent; return { ...d, start, end: (acc / 100) * 360 }; });
  const r = 40; const cx = 50; const cy = 50;
  const arc = (s: number, e: number, color: string) => {
    const rad = (a: number) => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(rad(s)); const y1 = cy + r * Math.sin(rad(s));
    const x2 = cx + r * Math.cos(rad(e)); const y2 = cy + r * Math.sin(rad(e));
    return <path key={color + s} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${e - s > 180 ? 1 : 0},1 ${x2},${y2} Z`} fill={color} />;
  };
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Répartition par type d'email</h3>
      <div className="flex gap-4 items-center">
        <div className="relative"><svg width={100} height={100} viewBox="0 0 100 100">{slices.map((s) => arc(s.start, s.end, s.color))}</svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{total.toLocaleString('fr-FR')}</div></div>
        <div className="flex-1 space-y-1 text-sm">{data.map((d) => (
          <div key={d.label} className="flex justify-between"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.label}</span><span>{d.percent}%</span></div>
        ))}</div>
      </div>
    </div>
  );
}
