import { Icon } from '../../Icon';
import type { CampaignAutomation } from '../../../lib/admin/campaigns-types';

export function CampaignAutomationsCard({ automations, onCreate }: { automations: CampaignAutomation[]; onCreate?: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="arrow-path" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Automatisations</h3></div>
        {onCreate && <button type="button" onClick={onCreate} className="text-xs text-purple-600 font-medium">+ Workflow</button>}
      </div>
      <div className="space-y-2">{automations.map((a) => (
        <div key={a.id} className="flex justify-between text-xs border-b pb-2">
          <div><p className="font-medium">{a.name}</p><p className="text-gray-400">{a.trigger}</p></div>
          <div className="text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{a.status}</span><p className="mt-1">{a.conversions} conv. • {a.revenue.toLocaleString('fr-FR')} $</p></div>
        </div>
      ))}</div>
    </div>
  );
}
