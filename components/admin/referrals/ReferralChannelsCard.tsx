import { Icon } from '../../Icon';
import type { ReferralChannelPerformance } from '../../../lib/admin/referrals-types';

export function ReferralChannelsCard({ channels }: { channels: ReferralChannelPerformance[] }) {
  const maxConv = Math.max(...channels.map((c) => c.conversions), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="device-phone-mobile" className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-semibold">Canaux performants</h3>
      </div>
      <div className="space-y-3">
        {channels.map((c) => (
          <div key={c.channel} className="text-xs">
            <div className="flex justify-between mb-1">
              <span className="font-medium">{c.channel}</span>
              <span><span className="text-gray-500">{c.conversions} conv.</span> <span className="font-bold text-green-600 ml-2">{c.roi}x ROI</span></span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(c.conversions / maxConv) * 100}%`, background: c.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
