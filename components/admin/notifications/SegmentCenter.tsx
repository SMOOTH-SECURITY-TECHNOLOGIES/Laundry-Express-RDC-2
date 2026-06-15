import type { NotificationSegment } from '../../../lib/admin/notifications-types';

export function SegmentCenter({ segments }: { segments: NotificationSegment[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Segment Center</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {segments.map((s) => (
          <div key={s.id} className="border rounded-xl p-4">
            <p className="font-semibold">{s.name}</p>
            <p className="text-2xl font-bold mt-1">{s.size.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-500">contacts</p>
            <div className="flex justify-between mt-3 text-xs text-gray-500">
              <span>Canal: {s.preferredChannel || '—'}</span>
              <span>Engagement: {s.engagementRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
