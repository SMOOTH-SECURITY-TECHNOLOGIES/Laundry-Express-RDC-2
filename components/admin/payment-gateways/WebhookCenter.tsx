import { PAYMENT_GATEWAYS_WRITE_ENABLED } from '../../../lib/admin/payment-gateways-api';
import type { PaymentWebhook } from '../../../lib/admin/payment-gateways-types';

export function WebhookCenter({ webhooks, onTest }: { webhooks: PaymentWebhook[]; onTest: (slug: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Webhook Center</h3>
      {webhooks.map((w) => (
        <div key={w.id} className="border rounded-xl p-4 mb-3 text-sm">
          <p className="font-semibold capitalize">{w.gatewaySlug}</p>
          <p className="text-xs text-gray-400 truncate">{w.endpoint}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Succès: {w.successCount}</span><span className="text-red-600">Erreurs: {w.errorCount}</span><span>Retries: {w.retryCount}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">{w.events.map((e) => <code key={e} className="text-[10px] bg-gray-100 px-1 rounded">{e}</code>)}</div>
          <button type="button" disabled={!PAYMENT_GATEWAYS_WRITE_ENABLED} onClick={() => onTest(w.gatewaySlug)} className="mt-2 text-xs text-blue-600 font-semibold disabled:opacity-40">Tester webhook</button>
        </div>
      ))}
    </div>
  );
}
