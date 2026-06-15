import type { OtpKpis, OtpRecord } from '../../../lib/admin/sms-types';

export function OtpCenter({ kpis, records }: { kpis: OtpKpis; records: OtpRecord[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{kpis.sent.toLocaleString('fr-FR')}</p><p className="text-xs text-gray-500">OTP envoyés</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{kpis.validated.toLocaleString('fr-FR')}</p><p className="text-xs text-gray-500">OTP validés</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold text-green-600">{kpis.successRate}%</p><p className="text-xs text-gray-500">Taux succès</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{kpis.avgValidationSec}s</p><p className="text-xs text-gray-500">Temps moyen validation</p></div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">OTP récents</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Téléphone</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Expiration</th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.phoneNumber}</td>
                <td className="px-4 py-3 font-mono">{r.codeMasked}</td>
                <td className="px-4 py-3">{r.statusLabel}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{r.expiresAt ? new Date(r.expiresAt).toLocaleString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
