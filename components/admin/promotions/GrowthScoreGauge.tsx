import { Icon } from '../../Icon';
import type { GrowthScore } from '../../../lib/admin/promotions-types';

export function GrowthScoreGauge({ score }: { score: GrowthScore }) {
  const angle = (score.score / 100) * 180 - 90;
  const color = score.score >= 80 ? '#22C55E' : score.score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="trophy" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Growth Score</h3></div>
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-24">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <defs><linearGradient id="growthGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#EF4444" /><stop offset="50%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#22C55E" /></linearGradient></defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#growthGrad)" strokeWidth="14" strokeLinecap="round" />
            <line x1="100" y1="100" x2={100 + 55 * Math.cos((angle * Math.PI) / 180)} y2={100 + 55 * Math.sin((angle * Math.PI) / 180)} stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill={color} />
          </svg>
        </div>
        <p className="text-3xl font-bold mt-2" style={{ color }}>{score.score} <span className="text-lg text-gray-400">/ 100</span></p>
        <p className="text-sm font-semibold" style={{ color }}>{score.label}</p>
        <div className="grid grid-cols-2 gap-2 mt-4 w-full text-[10px]">
          {[{ l: 'Acquisition', v: score.acquisition }, { l: 'Conversion', v: score.conversion }, { l: 'Rétention', v: score.retention }, { l: 'Réactivation', v: score.reactivation }].map((i) => (
            <div key={i.l} className="rounded-lg bg-gray-50 dark:bg-slate-800 p-2 text-center"><p className="text-gray-500">{i.l}</p><p className="font-bold text-gray-900 dark:text-slate-100">{i.v}%</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}
