import { Icon } from '../../Icon';
import type { ChannelDistribution } from '../../../lib/admin/reviews-types';

export function ChannelDistributionChart({ channels }: { channels: ChannelDistribution[] }) {
  const max = Math.max(...channels.map((c) => c.percent), 1);
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="share" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Répartition par canal</h3></div>
      <div className="space-y-2">{channels.map((c) => (
        <div key={c.channel}>
          <div className="flex justify-between text-xs mb-1"><span>{c.channel}</span><span className="text-gray-500">{c.percent}%</span></div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(c.percent / max) * 100}%`, background: c.color }} /></div>
        </div>
      ))}</div>
    </div>
  );
}
