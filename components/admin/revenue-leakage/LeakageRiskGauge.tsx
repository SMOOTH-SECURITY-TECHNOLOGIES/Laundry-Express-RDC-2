import { Icon } from '../../Icon';
import type { LeakageRiskScore } from '../../../lib/admin/revenue-leakage-types';

const levelColors: Record<string, string> = {
  green: '#22C55E', yellow: '#FBBF24', orange: '#F59E0B', red: '#EF4444',
};

export function LeakageRiskGauge({ risk }: { risk: LeakageRiskScore }) {
  const color = levelColors[risk.level] || '#EF4444';
  const angle = (risk.score / 100) * 180 - 90;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="exclamation-circle" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Revenue Leakage Risk</h3></div>
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-28">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <defs>
              <linearGradient id="leakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22C55E" /><stop offset="33%" stopColor="#FBBF24" /><stop offset="66%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#leakGrad)" strokeWidth="14" strokeLinecap="round" />
            <line x1="100" y1="100" x2={100 + 60 * Math.cos((angle * Math.PI) / 180)} y2={100 + 60 * Math.sin((angle * Math.PI) / 180)} stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill={color} />
          </svg>
        </div>
        <p className="text-3xl font-bold mt-2" style={{ color }}>{risk.score} <span className="text-lg text-gray-400">/ 100</span></p>
        <p className="text-sm font-semibold mt-1" style={{ color }}>{risk.label}</p>
        <div className="flex gap-3 mt-3 text-[10px]">
          {['GREEN', 'YELLOW', 'ORANGE', 'RED'].map((l) => (
            <span key={l} className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded-full" style={{ background: levelColors[l.toLowerCase()] }} />{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
