import type { NotificationAutomation } from '../../../lib/admin/notifications-types';

export function AutomationsTable({ automations }: { automations: NotificationAutomation[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Automatisations actives</h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 uppercase">
          <tr><th className="text-left pb-2">Automatisation</th><th className="text-left pb-2">Déclencheur</th><th className="text-left pb-2">Canal</th><th className="text-left pb-2">Statut</th></tr>
        </thead>
        <tbody>
          {automations.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="py-2 font-medium">{a.name}</td>
              <td className="py-2 text-gray-500 text-xs">{a.triggerLabel}</td>
              <td className="py-2">{a.channel}</td>
              <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.status === 'active' ? 'Active' : 'Pause'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
