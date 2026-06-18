import React from 'react';
import { CARD, TYPO, SPACING } from '../ui/tokens';

/* ─── Types ─── */
interface ChartPoint {
  label: string;
  completed: number;
  cancelled: number;
  rejected: number;
}

interface DriverHistoryChartProps {
  data: ChartPoint[];
  range: string;
  onRangeChange: (range: string) => void;
}

/* ─── Component ─── */
export const DriverHistoryChart: React.FC<DriverHistoryChartProps> = ({
  data,
  range,
  onRangeChange,
}) => {
  const max = Math.max(...data.flatMap((d) => [d.completed, d.cancelled, d.rejected]), 1);
  const width = 340;
  const height = 180;
  const pad = { left: 30, right: 10, top: 15, bottom: 30 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const lineFor = (key: 'completed' | 'cancelled' | 'rejected') =>
    data
      .map((d, i) => {
        const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = pad.top + chartH - (d[key] / max) * chartH;
        return `${x},${y}`;
      })
      .join(' ');

  const pctCompleted = data.reduce((s, d) => s + d.completed, 0);
  const pctCancelled = data.reduce((s, d) => s + d.cancelled, 0);
  const pctRejected = data.reduce((s, d) => s + d.rejected, 0);
  const total = pctCompleted + pctCancelled + pctRejected || 1;

  return (
    <div className={`${CARD.base} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={TYPO.sectionTitle}>Historique missions</h3>
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface-muted px-2 py-1 text-xs font-bold text-content-primary"
        >
          <option value="7">7 jours</option>
          <option value="30">30 jours</option>
          <option value="90">90 jours</option>
        </select>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-3 mb-2 text-[10px] text-content-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-4 rounded-full bg-green-500" /> Terminées
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-4 rounded-full bg-red-500" /> Annulées
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-4 rounded-full bg-slate-400" /> Rejetées
        </span>
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-0">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <g key={pct}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={pad.top + chartH - pct * chartH}
                y2={pad.top + chartH - pct * chartH}
                stroke="#e8f0fb"
                strokeDasharray="4 4"
              />
              <text
                x={pad.left - 8}
                y={pad.top + chartH - pct * chartH + 3}
                textAnchor="end"
                className="fill-[#6c7894] text-[8px]"
              >
                {Math.round(max * pct)}
              </text>
            </g>
          ))}

          {/* Lines */}
          <polyline fill="none" stroke="#22C55E" strokeWidth="2" points={lineFor('completed')} />
          <polyline fill="none" stroke="#EF4444" strokeWidth="2" points={lineFor('cancelled')} />
          <polyline fill="none" stroke="#94a3b8" strokeWidth="2" points={lineFor('rejected')} />

          {/* X-axis labels */}
          {data.map((d, i) => {
            const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
            return i % Math.ceil(data.length / 7) === 0 ? (
              <text key={i} x={x} y={height - 8} textAnchor="middle" className="fill-[#6c7894] text-[7px]">
                {d.label}
              </text>
            ) : null;
          })}
        </svg>
      </div>

      {/* Summary */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/20">
          <p className="text-lg font-black text-green-600">{pctCompleted}</p>
          <p className="text-[9px] font-bold text-green-700">Terminées</p>
        </div>
        <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/20">
          <p className="text-lg font-black text-red-600">{pctCancelled}</p>
          <p className="text-[9px] font-bold text-red-700">Annulées</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
          <p className="text-lg font-black text-slate-500">{pctRejected}</p>
          <p className="text-[9px] font-bold text-slate-600">Rejetées</p>
        </div>
      </div>
    </div>
  );
};

export default DriverHistoryChart;
