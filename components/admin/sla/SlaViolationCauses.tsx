import { Icon } from '../../Icon';
import type { SlaViolationCause } from '../../../lib/admin/sla-types';

export function SlaViolationCauses({ causes }: { causes: SlaViolationCause[] }) {
  const r = 54; const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Causes des violations SLA</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
            {causes.map((c) => {
              const dash = (c.percent / 100) * circ;
              const el = <circle key={c.label} cx="60" cy="60" r={r} fill="none" stroke={c.color} strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </svg>
        </div>
        <div className="space-y-2 flex-1">
          {causes.map((c) => (
            <div key={c.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-gray-700">{c.label}</span>
              </div>
              <span className="font-semibold text-gray-900">{c.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
