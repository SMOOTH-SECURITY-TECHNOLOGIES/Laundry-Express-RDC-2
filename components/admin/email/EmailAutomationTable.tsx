import type { EmailAutomation } from '../../../lib/admin/email-types';

export function EmailAutomationTable({ automations }: { automations: EmailAutomation[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Automatisations actives</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Workflow</th><th className="px-4 py-3">Déclencheur</th><th className="px-4 py-3">Template</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Volume 30j</th><th className="px-4 py-3">Performance</th></tr></thead>
        <tbody>{automations.map((a) => (
          <tr key={a.id} className="border-t">
            <td className="px-4 py-3 font-medium">{a.name}</td><td className="px-4 py-3">{a.triggerLabel}</td><td className="px-4 py-3 text-gray-500">{a.templateName}</td>
            <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{a.status}</span></td>
            <td className="px-4 py-3">{a.volume30d.toLocaleString('fr-FR')}</td><td className="px-4 py-3">{a.openRate}% / {a.clickRate}%</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
