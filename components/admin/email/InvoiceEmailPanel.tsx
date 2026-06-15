import type { InvoiceSummary, InvoiceLog } from '../../../lib/admin/email-types';

export function InvoiceEmailPanel({ summary, invoices }: { summary: InvoiceSummary; invoices: InvoiceLog[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[{ l: 'Envoyées', v: summary.sent }, { l: 'Ouvertes', v: summary.opened }, { l: 'Téléchargées', v: summary.downloaded }, { l: 'Relances', v: summary.reminders }, { l: 'Échecs', v: summary.failures }].map((k) => (
          <div key={k.l} className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{k.v.toLocaleString('fr-FR')}</p><p className="text-xs text-gray-500">{k.l}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Facture</th><th className="px-4 py-3">Destinataire</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Ouvert</th><th className="px-4 py-3">Téléchargé</th><th className="px-4 py-3">Relances</th></tr></thead>
          <tbody>{invoices.map((i) => (
            <tr key={i.id} className="border-t">
              <td className="px-4 py-3 font-mono">{i.invoiceRef}</td><td className="px-4 py-3">{i.recipientEmail}</td><td className="px-4 py-3">{i.status}</td>
              <td className="px-4 py-3">{i.opened ? '✓' : '—'}</td><td className="px-4 py-3">{i.downloaded ? '✓' : '—'}</td><td className="px-4 py-3">{i.reminderCount}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
