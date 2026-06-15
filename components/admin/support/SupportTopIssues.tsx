import { Icon } from '../../Icon';
import type { TopIssue } from '../../../lib/admin/support-types';

const IMP: Record<string, string> = { high: 'text-red-600 bg-red-50', medium: 'text-orange-600 bg-orange-50', low: 'text-gray-600 bg-gray-50' };

export function SupportTopIssues({ issues }: { issues: TopIssue[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="warning" className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-semibold">Top problèmes</h3></div>
      <table className="w-full text-xs">
        <thead className="text-gray-500"><tr><th className="text-left py-2">Problème</th><th className="text-right py-2">Tickets</th><th className="text-right py-2">Variation</th><th className="text-right py-2">Impact</th></tr></thead>
        <tbody>{issues.map((i) => (
          <tr key={i.issue} className="border-t"><td className="py-2">{i.issue}</td><td className="py-2 text-right">{i.tickets}</td><td className={`py-2 text-right ${i.variation >= 0 ? 'text-red-500' : 'text-green-500'}`}>{i.variation > 0 ? '+' : ''}{i.variation}%</td><td className="py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] capitalize ${IMP[i.impact]}`}>{i.impact}</span></td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
