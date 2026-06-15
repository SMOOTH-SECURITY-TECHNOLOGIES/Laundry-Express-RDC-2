import { Icon } from '../../Icon';
import type { DriverActivity } from '../../../lib/admin/drivers-types';

export function DriverActivityStream({ activities }: { activities: DriverActivity[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="clock" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Activité en temps réel</h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
        </span>
      </div>
      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon name={a.icon as 'truck'} className={`w-4 h-4 ${a.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-800">{a.message}</p>
              <p className="text-[10px] text-gray-400">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
