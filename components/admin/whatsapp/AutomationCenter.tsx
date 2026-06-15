import type { WhatsappAutomation } from '../../../lib/admin/whatsapp-types';

export function AutomationCenter({ automations, onCreate }: { automations: WhatsappAutomation[]; onCreate: () => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between"><h3 className="font-semibold">Automation Center</h3><button type="button" onClick={onCreate} className="text-xs text-blue-600">+ Workflow</button></div>
      <div className="divide-y">
        {automations.map((a) => (
          <div key={a.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="font-medium text-sm">{a.name}</p>
              <p className="text-xs text-gray-500">Trigger : {a.triggerLabel} · {a.runsCount.toLocaleString('fr-FR')} exécutions</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{a.status}</span>
              <p className="text-xs text-gray-400 mt-1">{a.successRate}% succès</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
