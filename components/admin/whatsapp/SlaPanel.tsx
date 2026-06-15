import type { WhatsappSla } from '../../../lib/admin/whatsapp-types';

const dot: Record<string, string> = { green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500' };

export function SlaPanel({ sla }: { sla: WhatsappSla }) {
  const items = [
    { label: 'Temps première réponse', value: sla.firstResponseAvg, status: sla.firstResponseStatus },
    { label: 'Temps résolution', value: sla.resolutionAvg, status: sla.resolutionStatus },
    { label: 'Conversations ouvertes', value: sla.openConversations.toLocaleString('fr-FR'), status: sla.openStatus },
    { label: 'SLA dépassés', value: String(sla.slaBreached), status: sla.breachedStatus },
  ];
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">SLA Center</h3>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dot[i.status] || 'bg-gray-400'}`} />
              <span className="text-sm">{i.label}</span>
            </div>
            <span className="font-bold text-sm">{i.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
