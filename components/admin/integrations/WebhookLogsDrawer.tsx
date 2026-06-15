import { Icon } from '../../Icon';
import type { Webhook, WebhookDelivery } from '../../../lib/admin/integrations-types';

export function WebhookLogsDrawer({ webhook, deliveries, onClose }: {
  webhook: Webhook | null; deliveries: WebhookDelivery[]; onClose: () => void;
}) {
  if (!webhook) return null;
  const filtered = deliveries.filter((d) => d.webhookId === webhook.id);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-xl p-6">
        <div className="flex justify-between mb-4">
          <div><h3 className="font-bold">Webhook Delivery View</h3><p className="text-sm text-gray-500">{webhook.name}</p></div>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-gray-400 mb-4">100 derniers appels · {filtered.length} affichés</p>
        {filtered.length === 0 ? <p className="text-gray-500 text-sm">Aucun appel enregistré.</p> : filtered.map((d) => (
          <div key={d.id} className="border rounded-xl p-4 mb-3 text-sm">
            <div className="flex justify-between mb-2">
              <span className={`px-2 py-0.5 rounded text-xs ${d.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.status}</span>
              <span className="text-xs text-gray-400">{d.durationMs} ms · {d.attempts} tentative(s)</span>
            </div>
            {d.signature && <p className="text-xs font-mono text-gray-500 mb-1">Signature: {d.signature}</p>}
            {d.payload && <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mb-2">{JSON.stringify(d.payload, null, 2)}</pre>}
            {d.responseBody && <p className="text-xs text-gray-600">Réponse: {d.responseBody}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
