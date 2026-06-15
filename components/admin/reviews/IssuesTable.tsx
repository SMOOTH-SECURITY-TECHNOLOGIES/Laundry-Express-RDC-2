import { Icon } from '../../Icon';
import type { ReviewIssue } from '../../../lib/admin/reviews-types';

export function IssuesTable({ issues }: { issues: ReviewIssue[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="warning" className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-semibold">Top problèmes</h3></div>
      <table className="w-full text-xs"><thead className="text-gray-500"><tr><th className="text-left py-2">Problème</th><th className="text-right py-2">Tickets</th><th className="text-right py-2">Évolution</th><th className="text-right py-2">Impact</th></tr></thead>
        <tbody>{issues.map((i) => <tr key={i.issue} className="border-t"><td className="py-2">{i.issue}</td><td className="py-2 text-right">{i.tickets}</td><td className={`py-2 text-right ${i.variation >= 0 ? 'text-red-500' : 'text-green-500'}`}>{i.variation > 0 ? '+' : ''}{i.variation}%</td><td className="py-2 text-right capitalize">{i.impact}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
