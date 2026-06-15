import type { UnsubscribeSummary, EmailUnsubscribe } from '../../../lib/admin/email-types';

export function UnsubscribeCenter({ summary, items }: { summary: UnsubscribeSummary; items: EmailUnsubscribe[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{summary.total}</p><p className="text-xs text-gray-500">Total désabonnés</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{summary.campaign}</p><p className="text-xs text-gray-500">Campagne</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{summary.marketing}</p><p className="text-xs text-gray-500">Marketing</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{summary.preferencesCount}</p><p className="text-xs text-gray-500">Préférences</p></div>
      </div>
      <p className="text-xs text-gray-500">Marketing opt-out respecté · Transactionnels toujours autorisés · Audit consentement actif</p>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Raison</th></tr></thead>
          <tbody>{items.map((u) => (<tr key={u.id} className="border-t"><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3">{u.typeLabel}</td><td className="px-4 py-3 text-gray-500">{u.reason}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
