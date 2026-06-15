import { Icon } from '../../Icon';
import type { LoyaltyIntegration } from '../../../lib/admin/loyalty-types';

const navMap: Record<string, string> = {
  Promotions: 'Promotions', Parrainage: 'Parrainage', Commandes: 'Commandes',
  Paiements: 'Paiements', 'Revenue Leakage': 'Revenue Leakage', 'Activity Log': 'Activity Log',
};

export function LoyaltyIntegrationsCard({ integrations }: { integrations: LoyaltyIntegration[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="share" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Intégrations clés</h3></div>
      <div className="space-y-2">
        {integrations.map((i) => (
          <button
            key={i.module}
            type="button"
            onClick={() => navMap[i.module] && window.dispatchEvent(new CustomEvent('admin-navigate', { detail: navMap[i.module] }))}
            className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <span className="font-medium">{i.module}</span>
            <span className={`text-[10px] font-bold ${i.connected ? 'text-green-600' : 'text-gray-400'}`}>{i.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
