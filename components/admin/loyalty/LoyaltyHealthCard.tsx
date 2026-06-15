import { Icon } from '../../Icon';
import type { LoyaltyHealth } from '../../../lib/admin/loyalty-types';

const statusStyle: Record<string, { label: string; color: string }> = {
  healthy: { label: 'Healthy', color: 'text-green-600' },
  warning: { label: 'Warning', color: 'text-orange-600' },
  critical: { label: 'Critical', color: 'text-red-600' },
};

export function LoyaltyHealthCard({ health }: { health: LoyaltyHealth }) {
  const st = statusStyle[health.status] || statusStyle.healthy;
  const pct = health.score;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="heart" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold">Loyalty Health</h3></div>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-14 overflow-hidden">
          <div className="absolute inset-0 rounded-t-full border-8 border-gray-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-t-full border-8 border-purple-500" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <span className="text-xl font-bold">{health.score}<span className="text-xs text-gray-500">/100</span></span>
          </div>
        </div>
        <div>
          <p className={`text-lg font-bold ${st.color}`}>{st.label}</p>
          <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-slate-400">
            <p>Redemption: {health.redemptionRate}%</p>
            <p>Liability: {health.pointsLiability.toLocaleString('fr-FR')} $</p>
            <p>Rétention uplift: +{health.retentionUplift}%</p>
            <p>Fraud risk: {health.fraudRisk}/100</p>
            <p>Unused points: {health.unusedPoints.toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
