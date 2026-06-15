import { Icon } from '../../Icon';
import type { CampaignFunnelStep } from '../../../lib/admin/campaigns-types';

export function CampaignFunnel({ steps }: { steps: CampaignFunnelStep[] }) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Entonnoir marketing</h3></div>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.stage}>
            <div className="flex justify-between text-xs mb-1"><span className="font-medium">{s.stage}</span><span>{s.count.toLocaleString('fr-FR')}{i > 0 && <span className="text-gray-400 ml-1">({s.rate}%)</span>}</span></div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(s.count / max) * 100}%` }} /></div>
            {i < steps.length - 1 && <p className="text-center text-gray-300 text-xs my-1">↓</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
