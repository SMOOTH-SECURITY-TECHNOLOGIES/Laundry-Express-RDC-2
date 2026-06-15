import { Icon } from '../../Icon';
import type { ReferralImpactMetric } from '../../../lib/admin/referrals-types';

export function ReferralImpactTable({ metrics }: { metrics: ReferralImpactMetric[] }) {
  const fmt = (v: number, indicator: string) => {
    if (indicator.toLowerCase().includes('taux') || indicator.toLowerCase().includes('rétention')) return `${v}%`;
    if (indicator.toLowerCase().includes('panier')) return `${v} $`;
    return String(v);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold">Impact du parrainage</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-2">Indicateur</th>
              <th className="pb-2 pr-2">Parrainés</th>
              <th className="pb-2 pr-2">Non parrainés</th>
              <th className="pb-2">Différence</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.indicator} className="border-b border-gray-50 dark:border-slate-800">
                <td className="py-2 pr-2 font-medium">{m.indicator}</td>
                <td className="py-2 pr-2">{fmt(m.referred, m.indicator)}</td>
                <td className="py-2 pr-2">{fmt(m.nonReferred, m.indicator)}</td>
                <td className="py-2 font-bold text-green-600">+{m.difference}{m.indicator.toLowerCase().includes('taux') || m.indicator.toLowerCase().includes('rétention') ? ' pts' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
