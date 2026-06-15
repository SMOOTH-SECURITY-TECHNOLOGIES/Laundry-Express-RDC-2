import { Icon } from '../../Icon';
import type { LoyaltySummary } from '../../../lib/admin/users-types';

export function UsersLoyaltyCard({ loyalty }: { loyalty: LoyaltySummary }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="gift" className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold">Utilisateurs fidélité</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
        <Stat label="Avec points" value={`${loyalty.usersWithPoints} (${loyalty.usersWithPointsPercent}%)`} />
        <Stat label="Points totaux" value={loyalty.totalPoints.toLocaleString('fr-FR')} />
        <Stat label="Solde moyen" value={`${Math.round(loyalty.averageBalance).toLocaleString('fr-FR')} pts`} />
      </div>
      <h4 className="text-xs font-semibold text-gray-500 mb-2">Top détenteurs</h4>
      <div className="space-y-2">
        {loyalty.topHolders.map((h) => (
          <div key={h.name} className="flex justify-between text-xs">
            <span>{h.name}</span>
            <span className="font-medium text-purple-600">{h.points.toLocaleString('fr-FR')} pts</span>
          </div>
        ))}
        {loyalty.topHolders.length === 0 && <p className="text-xs text-gray-400">Aucun détenteur.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
      <p className="text-gray-500">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  );
}
