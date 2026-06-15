import type { EmailDeliverability, DomainPerformance } from '../../../lib/admin/email-types';

const healthColors: Record<string, string> = { healthy: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' };

export function DeliverabilityCenter({ deliverability, domainPerformance }: { deliverability: EmailDeliverability[]; domainPerformance: DomainPerformance[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-4">Deliverability Center</h3>
        <div className="space-y-4">
          {deliverability.map((d) => (
            <div key={d.domain} className="border rounded-xl p-4">
              <div className="flex justify-between mb-2"><span className="font-medium">{d.domain}</span><span className={`px-2 py-0.5 rounded-full text-xs ${healthColors[d.healthStatus] || ''}`}>{d.healthLabel}</span></div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span>SPF: {d.spf}</span><span>DKIM: {d.dkim}</span><span>DMARC: {d.dmarc}</span>
                <span>Bounce: {d.bounceRate}%</span><span>Spam: {d.spamComplaints}%</span><span>Score: {d.reputationScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-4">Performance par domaine</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500"><tr><th className="pb-2">Domaine</th><th className="pb-2">Livraison</th><th className="pb-2">Ouverture</th><th className="pb-2">Clic</th><th className="pb-2">Bounce</th></tr></thead>
          <tbody>{domainPerformance.map((d) => (
            <tr key={d.domain} className="border-t"><td className="py-2">{d.domain}</td><td className="py-2">{d.deliveryRate}%</td><td className="py-2">{d.openRate}%</td><td className="py-2">{d.clickRate}%</td><td className="py-2 text-red-600">{d.bounceRate}%</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
