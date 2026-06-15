import type { SmsWebhook } from '../../../lib/admin/sms-types';

export function WebhookPanel({ webhooks }: { webhooks: SmsWebhook[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">API & Webhooks</h3>
      {webhooks.map((w) => (
        <div key={w.id} className="border rounded-xl p-4 mb-3">
          <p className="text-xs font-mono break-all">{w.endpoint}</p>
          <p className="text-xs text-gray-400 mt-1">Secret : {w.secretMasked}</p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-600">{w.successCount.toLocaleString('fr-FR')} succès</span>
            <span className="text-red-600">{w.errorCount} erreurs</span>
            {w.consecutiveErrors > 0 && <span className="text-orange-600">{w.consecutiveErrors} consécutives</span>}
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-500 mt-2">Connecteurs : Onafriq, Orange RDC, Airtel RDC, Vodacom RDC, Africell RDC, Twilio</p>
    </div>
  );
}
