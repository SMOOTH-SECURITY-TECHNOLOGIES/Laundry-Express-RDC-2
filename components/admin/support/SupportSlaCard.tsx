import { Icon } from '../../Icon';
import type { SlaBreakdown } from '../../../lib/admin/support-types';

export function SupportSlaCard({ sla, days, onDaysChange }: { sla: SlaBreakdown; days: number; onDaysChange: (d: number) => void }) {
  const r = 40; const circ = 2 * Math.PI * r;
  const dash = (sla.compliancePercent / 100) * circ;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="shield-check" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Performance SLA</h3></div>
        <div className="flex gap-1">{[7, 30].map((d) => <button key={d} type="button" onClick={() => onDaysChange(d)} className={`px-2 py-1 rounded-lg text-[10px] ${days === d ? 'bg-purple-600 text-white' : 'border'}`}>{d}j</button>)}</div>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="14" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="#22C55E" strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold">{sla.compliancePercent}%</span><span className="text-[10px] text-gray-500">SLA respecté</span></div>
        </div>
        <div className="flex-1 space-y-2 text-xs">
          <Row label="Dans SLA" value={sla.withinSla} color="#22C55E" />
          <Row label="À risque" value={sla.atRisk} color="#F59E0B" />
          <Row label="Hors SLA" value={sla.breached} color="#EF4444" />
          <p className="text-gray-500 pt-2">Temps moyen résolution : <strong>{sla.avgResolutionMinutes} min</strong></p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: color }} />{label}</span><span>{value}</span></div>;
}
