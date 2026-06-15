import type { OperatorDistribution } from '../../../lib/admin/sms-types';

export function OperatorDistributionChart({ data }: { data: OperatorDistribution[] }) {
  const total = data.reduce((s, d) => s + d.volume, 0);
  let acc = 0;
  const slices = data.map((d) => {
    const start = (acc / total) * 360; acc += d.volume;
    return { ...d, start, end: (acc / total) * 360 };
  });
  const r = 40; const cx = 50; const cy = 50;
  const arc = (s: number, e: number, color: string) => {
    const rad = (a: number) => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(rad(s)); const y1 = cy + r * Math.sin(rad(s));
    const x2 = cx + r * Math.cos(rad(e)); const y2 = cy + r * Math.sin(rad(e));
    const large = e - s > 180 ? 1 : 0;
    return <path key={color + s} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={color} />;
  };
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Répartition par opérateur</h3>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <svg width={100} height={100} viewBox="0 0 100 100">{slices.map((s) => arc(s.start, s.end, s.color))}</svg>
        <div className="flex-1 space-y-2 text-sm w-full">
          {data.map((d) => (
            <div key={d.slug} className="flex justify-between items-center">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: d.color }} />{d.name}</div>
              <div className="text-right text-xs text-gray-500">
                <span className="font-medium text-gray-900">{d.percent}%</span> · {d.deliveryRate}% livr. · {d.cost.toFixed(0)} $
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
