import type { ChurnMetrics } from '../../../lib/admin/subscriptions-types';

const metrics = [
  { key: 'newSubscribers', label: 'Nouveaux abonnés', suffix: '', color: 'bg-blue-500' },
  { key: 'cancellations', label: 'Résiliations', suffix: '', color: 'bg-red-500' },
  { key: 'trialConversion', label: 'Conversion essai', suffix: '%', color: 'bg-emerald-500' },
  { key: 'retention30', label: 'Rétention 30j', suffix: '%', color: 'bg-violet-500' },
  { key: 'retention90', label: 'Rétention 90j', suffix: '%', color: 'bg-amber-500' },
] as const;

function BarMetric({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}{suffix}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ChurnAnalysis({ metrics: m }: { metrics: ChurnMetrics }) {
  const maxVal = Math.max(m.newSubscribers, m.cancellations, m.trialConversion, m.retention30, m.retention90);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Analyse Churn</h3>
      <div className="flex flex-col gap-4">
        {metrics.map((item) => (
          <BarMetric
            key={item.key}
            label={item.label}
            value={m[item.key as keyof ChurnMetrics]}
            max={maxVal}
            color={item.color}
            suffix={item.suffix}
          />
        ))}
      </div>
    </div>
  );
}
