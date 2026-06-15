import { Icon } from '../../Icon';
import type { DriverRevenueTrend } from '../../../lib/admin/drivers-types';

export function DriverRevenueChart({ trend }: { trend: DriverRevenueTrend[] }) {
  const max = Math.max(...trend.map((t) => t.value), 1);
  const latest = trend[trend.length - 1]?.value ?? 0;
  const weekly = Math.round(latest * 0.28);
  const daily = Math.round(latest * 0.04);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Revenus générés</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Kpi label="Journalier" value={daily} />
        <Kpi label="Hebdo" value={weekly} />
        <Kpi label="Mensuel" value={latest} />
      </div>
      <div className="flex items-end gap-2 h-28">
        {trend.map((t) => (
          <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-violet-500 rounded-t-md" style={{ height: `${(t.value / max) * 100}%`, minHeight: 4 }} />
            <span className="text-[9px] text-gray-400">{t.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-violet-50 p-3 text-center">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-lg font-bold text-violet-700">{value.toLocaleString('fr-FR')} $</p>
    </div>
  );
}
