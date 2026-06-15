import type { SmsLog } from '../../../lib/admin/sms-types';

export function LogsCenter({ logs, onOpen }: { logs: SmsLog[]; onOpen: (l: SmsLog) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Logs SMS</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr><th className="px-4 py-3">Référence</th><th className="px-4 py-3">Téléphone</th><th className="px-4 py-3">Événement</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Provider ID</th><th className="px-4 py-3">Date</th></tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => onOpen(l)}>
              <td className="px-4 py-3 font-mono text-xs">{l.reference}</td>
              <td className="px-4 py-3">{l.phoneNumber}</td>
              <td className="px-4 py-3">{l.eventType}</td>
              <td className="px-4 py-3">{l.status}</td>
              <td className="px-4 py-3 text-xs">{l.providerId}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{l.createdAt ? new Date(l.createdAt).toLocaleString('fr-FR') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
