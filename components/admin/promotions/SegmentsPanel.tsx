import { Icon } from '../../Icon';
import type { PromoSegmentStats } from '../../../lib/admin/promotions-types';

export function SegmentsPanel({ segments }: { segments: PromoSegmentStats[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Segments performants</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2">Segment</th><th className="text-right py-2">Clients</th><th className="text-right py-2">CA</th><th className="text-right py-2">Conversion</th></tr></thead>
        <tbody>{segments.map((s) => (
          <tr key={s.segmentKey} className="border-b border-gray-50 dark:border-slate-800">
            <td className="py-2.5 font-medium">{s.segment}</td>
            <td className="py-2.5 text-right">{s.clients.toLocaleString('fr-FR')}</td>
            <td className="py-2.5 text-right font-bold text-green-600">{s.revenue.toLocaleString('fr-FR')} $</td>
            <td className="py-2.5 text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.conversionRate >= 18 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.conversionRate}%</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
