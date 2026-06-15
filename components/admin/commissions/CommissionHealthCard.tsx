import { Icon } from '../../Icon';
import type { CommissionHealth } from '../../../lib/admin/commissions-types';

export function CommissionHealthCard({ health }: { health: CommissionHealth }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const segments = [
    { pct: health.healthyPercent, color: '#22C55E', label: 'Healthy' },
    { pct: health.warningPercent, color: '#F59E0B', label: 'Warning' },
    { pct: health.criticalPercent, color: '#EF4444', label: 'Critical' },
  ];
  let offset = 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="shield-check" className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Commission Health</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
            {segments.map((s) => {
              const dash = (s.pct / 100) * circ;
              const el = <circle key={s.label} cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-green-600">{health.healthyPercent}%</span>
            <span className="text-[9px] text-gray-400">Healthy</span>
          </div>
        </div>
        <div className="flex-1 space-y-3 w-full">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-gray-700 dark:text-slate-300">{s.label}</span></div>
              <span className="font-semibold">{s.pct}%</span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-700">
            {[
              { label: 'Paiements attendus', value: health.expectedPayments },
              { label: 'Paiements reçus', value: health.receivedPayments },
              { label: 'Retards', value: health.delays },
              { label: 'Exceptions', value: health.exceptions },
            ].map((i) => (
              <div key={i.label} className="text-xs"><p className="text-gray-500 dark:text-slate-400">{i.label}</p><p className="font-bold text-gray-900 dark:text-slate-100">{i.value.toLocaleString('fr-FR')} $</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
