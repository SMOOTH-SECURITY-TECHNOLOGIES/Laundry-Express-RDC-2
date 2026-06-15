import type { SmsSender } from '../../../lib/admin/sms-types';

export function TopSendersTable({ senders }: { senders: SmsSender[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Top expéditeurs</h3>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-gray-500"><tr><th className="pb-2">Expéditeur</th><th className="pb-2">ID</th><th className="pb-2">Statut</th><th className="pb-2">Volume</th><th className="pb-2">Livraison</th></tr></thead>
        <tbody>
          {senders.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="py-2 font-medium">{s.name}</td>
              <td className="py-2 font-mono text-xs">{s.senderId}</td>
              <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${s.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{s.approvalLabel}</span></td>
              <td className="py-2">{s.volume.toLocaleString('fr-FR')}</td>
              <td className="py-2">{s.deliveryRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
