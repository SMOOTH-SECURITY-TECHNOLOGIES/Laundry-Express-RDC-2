import type { EmailAlert } from '../../../lib/admin/email-types';

const sev: Record<string, string> = { critical: 'border-red-300 bg-red-50', high: 'border-orange-300 bg-orange-50', medium: 'border-yellow-300 bg-yellow-50' };

export function AlertsPanel({ alerts }: { alerts: EmailAlert[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Alertes & incidents</h3>
      <div className="space-y-2">{alerts.map((a) => (
        <div key={a.id} className={`border rounded-xl p-3 text-sm flex justify-between ${sev[a.severity] || ''}`}><span>{a.title}</span><span className="font-bold">{a.count}</span></div>
      ))}</div>
    </div>
  );
}
