import { Icon } from '../../Icon';
import type { ReactivationStats } from '../../../lib/admin/ads-types';

export function ReactivationCenter({ data }: { data: ReactivationStats }) {
  const actions = ['Coupon', 'Email', 'SMS', 'WhatsApp'];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="arrow-path" className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Reactivation Center</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{data.dormantClients.toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-gray-500">Clients dormants</p>
        </div>
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center">
          <p className="text-lg font-bold text-green-600">{data.reactivated.toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-gray-500">Réactivés</p>
        </div>
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{data.revenueRecovered.toLocaleString('fr-FR')} $</p>
          <p className="text-[10px] text-gray-500">Revenu récupéré</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-2">Taux de réactivation: <span className="font-bold text-green-600">{data.reactivationRate}%</span></p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <span key={a} className="px-2 py-1 rounded-lg text-[10px] font-medium border border-gray-200 dark:border-slate-600">{a}</span>
        ))}
      </div>
    </div>
  );
}
