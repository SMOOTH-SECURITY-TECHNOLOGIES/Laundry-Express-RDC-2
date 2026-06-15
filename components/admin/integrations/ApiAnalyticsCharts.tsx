import type { AnalyticsSeries, EventDistribution, TopEndpoint } from '../../../lib/admin/integrations-types';

export function ApiAnalyticsCharts({ analytics, eventDistribution, topEndpoints }: {
  analytics: AnalyticsSeries[]; eventDistribution: EventDistribution[]; topEndpoints: TopEndpoint[];
}) {
  const distTotal = eventDistribution.reduce((s, e) => s + e.count, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics.map((s) => {
          const max = Math.max(...s.data.map((d) => d.value), 1);
          return (
            <div key={s.key} className="bg-white rounded-2xl border shadow-sm p-4">
              <h4 className="text-sm font-semibold mb-3">{s.title}</h4>
              <div className="flex items-end gap-1 h-24">{s.data.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(d.value / max) * 100}%`, minHeight: 2 }} />
                  <span className="text-[9px] text-gray-400">{d.label}</span>
                </div>
              ))}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-semibold mb-4">Top Endpoints (7 jours)</h3>
          <div className="space-y-2">{topEndpoints.map((e) => {
            const max = topEndpoints[0]?.calls || 1;
            return (
              <div key={`${e.method}${e.path}`}>
                <div className="flex justify-between text-xs mb-1"><span className="font-mono">{e.method} {e.path}</span><span>{e.calls.toLocaleString('fr-FR')}</span></div>
                <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-violet-500 rounded-full" style={{ width: `${(e.calls / max) * 100}%` }} /></div>
              </div>
            );
          })}</div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-semibold mb-4">Répartition des événements</h3>
          <div className="flex flex-wrap gap-3">{eventDistribution.map((e) => (
            <div key={e.label} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
              <span>{e.label}</span><span className="text-gray-400">{e.percent}%</span>
            </div>
          ))}</div>
          <p className="text-xs text-gray-400 mt-3">Total: {distTotal.toLocaleString('fr-FR')} événements</p>
        </div>
      </div>
    </div>
  );
}
