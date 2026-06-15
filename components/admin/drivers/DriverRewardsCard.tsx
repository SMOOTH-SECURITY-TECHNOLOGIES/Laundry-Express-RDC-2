import { Icon } from '../../Icon';
import type { DriverReward } from '../../../lib/admin/drivers-types';

export function DriverRewardsCard({ rewards }: { rewards: DriverReward[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="trophy" className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">Récompenses</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rewards.map((r) => (
          <div key={r.id} className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
            <Icon name={r.icon as 'trophy'} className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-900">{r.label}</p>
            <p className="text-xs text-gray-500 mt-1">{r.driverName}</p>
            <p className="text-[10px] text-gray-400">{r.earnedAt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
