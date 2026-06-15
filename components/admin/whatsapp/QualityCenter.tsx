import type { WhatsappQuality } from '../../../lib/admin/whatsapp-types';

const ratingColors: Record<string, string> = {
  high: 'text-green-600 bg-green-100', medium: 'text-amber-600 bg-amber-100', low: 'text-orange-600 bg-orange-100', flagged: 'text-red-600 bg-red-100',
};
const severityColors: Record<string, string> = { critical: 'border-red-200 bg-red-50', high: 'border-orange-200 bg-orange-50', medium: 'border-yellow-200 bg-yellow-50', low: 'border-green-200 bg-green-50' };

export function QualityCenter({ quality }: { quality: WhatsappQuality }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Quality Center — Meta</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border rounded-xl p-3"><p className="text-xs text-gray-500">Quality Rating</p><span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-sm font-medium ${ratingColors[quality.qualityRating] || ''}`}>{quality.qualityLabel}</span></div>
        <div className="border rounded-xl p-3"><p className="text-xs text-gray-500">Messaging Limit</p><p className="font-bold mt-1">{quality.messagingLimit}</p></div>
        <div className="border rounded-xl p-3"><p className="text-xs text-gray-500">Phone Status</p><p className="font-bold mt-1 text-green-600">{quality.phoneStatusLabel}</p></div>
        <div className="border rounded-xl p-3"><p className="text-xs text-gray-500">Verification</p><p className="font-bold mt-1 text-green-600">{quality.verificationLabel}</p></div>
      </div>
      {quality.alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">Alertes</p>
          {quality.alerts.map((a, i) => (
            <div key={i} className={`border rounded-lg p-2 text-sm ${severityColors[a.severity] || ''}`}>{a.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
