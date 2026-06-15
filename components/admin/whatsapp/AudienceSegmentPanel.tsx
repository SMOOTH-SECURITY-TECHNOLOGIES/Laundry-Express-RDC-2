import type { WhatsappSegment } from '../../../lib/admin/whatsapp-types';

export function AudienceSegmentPanel({ segments }: { segments: WhatsappSegment[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Audience Segments</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {segments.map((s) => (
          <div key={s.id} className="border rounded-xl p-3">
            <p className="font-medium text-sm">{s.name}</p>
            <p className="text-xs text-gray-500">{s.size.toLocaleString('fr-FR')} contacts</p>
            <div className="flex gap-3 mt-2 text-xs">
              <span>Engagement {s.engagement}%</span>
              <span>Conversion {s.conversion}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
