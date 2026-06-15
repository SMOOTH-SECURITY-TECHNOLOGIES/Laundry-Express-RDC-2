import type { RbacAnalyticsSeries } from '../../../lib/admin/rbac-types';

function BarChart({ series }: { series: RbacAnalyticsSeries }) {
  const max = Math.max(...series.data.map((d) => d.value), 1);
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h3 className="font-semibold mb-4">{series.title}</h3>
      <div className="flex items-end gap-2 h-32">
        {series.data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }} />
            <span className="text-[9px] text-gray-500 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ series }: { series: RbacAnalyticsSeries }) {
  const w = 200; const h = 80;
  const max = Math.max(...series.data.map((d) => d.value), 1);
  const pts = series.data.map((d, i) => `${(i / Math.max(series.data.length - 1, 1)) * w},${h - (d.value / max) * h}`).join(' ');
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h3 className="font-semibold mb-4">{series.title}</h3>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="text-blue-600">
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function RbacAnalyticsCharts({ analytics }: { analytics: RbacAnalyticsSeries[] }) {
  const bar = analytics.find((a) => a.key === 'users_by_permission');
  const line = analytics.find((a) => a.key === 'permission_changes');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {bar && <BarChart series={bar} />}
      {line && <LineChart series={line} />}
    </div>
  );
}
