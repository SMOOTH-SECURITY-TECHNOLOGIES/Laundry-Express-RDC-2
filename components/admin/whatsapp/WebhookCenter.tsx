import { Icon } from '../../Icon';
import type { WhatsappWebhook } from '../../../lib/admin/whatsapp-types';
import { WHATSAPP_WRITE_ENABLED } from '../../../lib/admin/whatsapp-api';

export function WebhookCenter({ webhooks, onTest, onReplay }: { webhooks: WhatsappWebhook[]; onTest: () => void; onReplay: (event: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Webhook Center</h3>
        <button type="button" disabled={!WHATSAPP_WRITE_ENABLED} onClick={onTest} className="text-xs text-blue-600 disabled:opacity-50">Tester webhook</button>
      </div>
      {webhooks.map((w) => (
        <div key={w.id} className="border rounded-xl p-4 mb-3">
          <p className="text-xs font-mono text-gray-600 break-all">{w.endpoint}</p>
          <p className="text-xs text-gray-400 mt-1">Secret : {w.secretMasked}</p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-600">{w.successCount.toLocaleString('fr-FR')} succès</span>
            <span className="text-red-600">{w.errorCount} erreurs</span>
            <span className="text-gray-500">{w.retryCount} retries</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {w.events.map((e) => (
              <button key={e} type="button" disabled={!WHATSAPP_WRITE_ENABLED} onClick={() => onReplay(e)} className="text-xs px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">{e}</button>
            ))}
          </div>
          {w.errorCount > 0 && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><Icon name="warning" className="w-3 h-3" /> {w.errorCount} webhooks échouent</p>}
        </div>
      ))}
    </div>
  );
}
