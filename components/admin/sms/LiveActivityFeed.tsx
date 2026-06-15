import type { SmsActivity } from '../../../lib/admin/sms-types';

export function LiveActivityFeed({ activities }: { activities: SmsActivity[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">Activité en temps réel <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /></h3>
      <div className="space-y-2">
        {activities.map((a) => (
          <div key={a.id} className="text-sm border-b pb-2 last:border-0">{a.message}</div>
        ))}
      </div>
    </div>
  );
}
