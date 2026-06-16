import { Icon } from '../../Icon';
import type { PilotDashboardSummary, PilotMetricHealth } from '../../../lib/admin/pilot-metrics';

const healthClass: Record<PilotMetricHealth, string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  watch: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-red-200 bg-red-50 text-red-700',
};

const healthLabel: Record<PilotMetricHealth, string> = {
  good: 'Bon',
  watch: 'A surveiller',
  risk: 'Risque',
};

export function PilotDashboard({ summary }: { summary: PilotDashboardSummary }) {
  const riskCount = summary.metrics.filter((metric) => metric.health === 'risk').length;
  const watchCount = summary.metrics.filter((metric) => metric.health === 'watch').length;

  return (
    <section className="space-y-5" aria-label="Pilot Dashboard">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="chartBar" className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-950">Pilot Dashboard</h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Mesure le vrai risque du pilote : est-ce que clients, partenaires et chauffeurs utilisent le systeme comme prevu ?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              Features freeze: {summary.freezePolicy.featuresFrozen ? 'ON' : 'OFF'}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Instrumentation: {summary.freezePolicy.instrumentationOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Regle pilote</p>
            <p className="mt-1 text-sm font-bold text-slate-950">{summary.freezePolicy.rule}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-xs text-amber-700">A surveiller</p>
            <p className="mt-1 text-2xl font-black text-amber-700">{watchCount}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs text-red-700">Risques</p>
            <p className="mt-1 text-2xl font-black text-red-700">{riskCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summary.metrics.map((metric) => (
          <article key={metric.key} className="flex min-h-[160px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold leading-snug text-slate-950">{metric.label}</p>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${healthClass[metric.health]}`}>
                  {healthLabel[metric.health]}
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-950">{metric.value}</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{metric.question}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
