import type { AnalyticsSeries } from '../../../lib/admin/email-types';

export function EmailAnalyticsPanel({ series }: { series: AnalyticsSeries[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {series.map((s) => {
        const max = Math.max(...s.data.map((d) => d.value), 1);
        return (
          <div key={s.key} className="bg-white rounded-2xl border shadow-sm p-4">
            <h4 className="text-sm font-semibold mb-3">{s.title}</h4>
            <div className="flex items-end gap-1 h-24">{s.data.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-violet-500 rounded-t" style={{ height: `${(d.value / max) * 100}%`, minHeight: 2 }} />
                <span className="text-[9px] text-gray-400">{d.label}</span>
              </div>
            ))}</div>
          </div>
        );
      })}
    </div>
  );
}
