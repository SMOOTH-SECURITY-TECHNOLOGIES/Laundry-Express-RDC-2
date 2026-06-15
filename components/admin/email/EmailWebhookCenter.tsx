import type { EmailWebhook } from '../../../lib/admin/email-types';
import { EMAIL_WRITE_ENABLED } from '../../../lib/admin/email-api';

export function EmailWebhookCenter({ webhooks, onTest, onReplay }: { webhooks: EmailWebhook[]; onTest: () => void; onReplay: (e: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex justify-between mb-4"><h3 className="font-semibold">Webhook Center</h3><button type="button" disabled={!EMAIL_WRITE_ENABLED} onClick={onTest} className="text-xs text-blue-600 disabled:opacity-50">Tester webhook</button></div>
      {webhooks.map((w) => (
        <div key={w.id} className="border rounded-xl p-4 mb-3">
          <p className="text-xs font-mono break-all">{w.endpoint}</p>
          <p className="text-xs text-gray-400 mt-1">Secret : {w.secretMasked}</p>
          <div className="flex gap-4 mt-2 text-sm"><span className="text-green-600">{w.successCount.toLocaleString('fr-FR')} succès</span><span className="text-red-600">{w.errorCount} erreurs</span></div>
          <div className="flex flex-wrap gap-1 mt-2">{w.events.map((e) => (
            <button key={e} type="button" disabled={!EMAIL_WRITE_ENABLED} onClick={() => onReplay(e)} className="text-xs px-2 py-0.5 bg-gray-100 rounded disabled:opacity-50">{e}</button>
          ))}</div>
        </div>
      ))}
    </div>
  );
}
