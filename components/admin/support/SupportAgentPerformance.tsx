import { Icon } from '../../Icon';
import type { AgentPerformance } from '../../../lib/admin/support-types';

export function SupportAgentPerformance({ agents }: { agents: AgentPerformance[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Agents performance</h3></div>
      <table className="w-full text-xs">
        <thead className="text-gray-500"><tr><th className="text-left py-2">Agent</th><th className="text-right py-2">Tickets</th><th className="text-right py-2">Réponse</th><th className="text-right py-2">SLA</th><th className="text-right py-2">Satisfaction</th></tr></thead>
        <tbody>{agents.map((a) => (
          <tr key={a.agentId} className="border-t"><td className="py-2 font-medium">{a.agentName}</td><td className="py-2 text-right">{a.ticketsHandled}</td><td className="py-2 text-right">{a.avgResponseMinutes} min</td><td className="py-2 text-right text-green-600">{a.slaPercent}%</td><td className="py-2 text-right">★ {a.satisfaction}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
