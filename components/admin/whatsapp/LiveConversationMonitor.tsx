import { Icon } from '../../Icon';
import type { LiveMonitor } from '../../../lib/admin/whatsapp-types';

export function LiveConversationMonitor({ monitor }: { monitor: LiveMonitor }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Surveillance en temps réel</h3>
        <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3"><p className="text-2xl font-bold text-blue-700">{monitor.activeConversations}</p><p className="text-xs text-gray-500">Conversations actives</p></div>
        <div className="bg-amber-50 rounded-xl p-3"><p className="text-2xl font-bold text-amber-700">{monitor.waitingConversations}</p><p className="text-xs text-gray-500">En attente</p></div>
        <div className="bg-red-50 rounded-xl p-3"><p className="text-2xl font-bold text-red-700">{monitor.slaBreached}</p><p className="text-xs text-gray-500">SLA dépassés</p></div>
        <div className="bg-orange-50 rounded-xl p-3"><p className="text-2xl font-bold text-orange-700">{monitor.escalations}</p><p className="text-xs text-gray-500">Escalades</p></div>
      </div>
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2">Agents disponibles</p>
        <div className="flex flex-wrap gap-2">
          {monitor.availableAgents.map((a) => (
            <span key={a} className="px-2 py-1 bg-gray-100 rounded-lg text-xs">{a}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-3">
        <div className="flex items-center gap-2"><Icon name="sparkles" className="w-4 h-4 text-emerald-600" /><span className="text-sm font-medium">IA Assistant</span></div>
        <span className="text-sm font-bold text-emerald-700">Active — {monitor.aiActivePct}%</span>
      </div>
      <p className="text-xs text-gray-400 mt-3">Backlog support : {monitor.supportBacklog} conversations</p>
    </div>
  );
}
