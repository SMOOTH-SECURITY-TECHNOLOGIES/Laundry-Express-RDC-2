import type { PaymentIncident } from '../../../lib/admin/payment-gateways-types';

const sevStyle: Record<string, string> = {
  critical: 'border-l-red-500 bg-red-50', high: 'border-l-orange-500 bg-orange-50',
  medium: 'border-l-amber-400 bg-amber-50', low: 'border-l-green-400 bg-green-50',
};

export function IncidentsCenter({ incidents }: { incidents: PaymentIncident[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Alertes & Incidents</h3>
      <ul className="space-y-2">
        {incidents.map((i) => (
          <li key={i.id} className={`border-l-4 pl-3 py-2 rounded-r-lg text-sm ${sevStyle[i.severity] || 'border-l-gray-300'}`}>
            <p className="font-semibold">{i.title}</p>
            <p className="text-xs text-gray-500">{i.impact} · {i.occurredAt ? new Date(i.occurredAt).toLocaleString('fr-FR') : ''}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
