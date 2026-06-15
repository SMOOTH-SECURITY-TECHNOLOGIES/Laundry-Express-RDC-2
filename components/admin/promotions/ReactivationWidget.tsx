import { Icon } from '../../Icon';
import type { ReactivationStats } from '../../../lib/admin/promotions-types';

export function ReactivationWidget({ data }: { data: ReactivationStats }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="arrow-path" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Réactivation clients</h3></div>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {[{ l: '30j+', v: data.dormant30 }, { l: '60j+', v: data.dormant60 }, { l: '90j+', v: data.dormant90 }].map((d) => (
          <div key={d.l} className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3"><p className="text-[10px] text-gray-500">Dormants {d.l}</p><p className="text-lg font-bold text-gray-900 dark:text-slate-100">{d.v.toLocaleString('fr-FR')}</p></div>
        ))}
      </div>
      <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 mb-4 text-center">
        <p className="text-2xl font-bold text-green-600">{data.reactivated}</p>
        <p className="text-xs text-gray-600 dark:text-slate-400">réactivés ({data.reactivationRate}%)</p>
        <p className="text-[10px] mt-1 text-purple-600 font-bold">Best Offer: {data.bestOffer}</p>
      </div>
      <div className="space-y-2">{data.topActions.map((a) => (
        <div key={a.action} className="flex justify-between text-xs"><span className="text-gray-700 dark:text-slate-300">{a.action}</span><span className="font-bold">{a.count}</span></div>
      ))}</div>
    </div>
  );
}
