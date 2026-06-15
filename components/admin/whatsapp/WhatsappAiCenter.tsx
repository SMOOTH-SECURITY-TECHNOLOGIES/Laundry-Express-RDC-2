import { Icon } from '../../Icon';
import type { WhatsappAiMetrics } from '../../../lib/admin/whatsapp-types';

export function WhatsappAiCenter({ metrics, onReview }: { metrics: WhatsappAiMetrics; onReview: () => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><Icon name="sparkles" className="w-4 h-4 text-emerald-600" /> WhatsApp AI Agent</h3>
        <button type="button" onClick={onReview} className="text-xs text-blue-600">Revoir réponses</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3"><p className="text-xl font-bold text-emerald-700">{metrics.aiConversationsPct}%</p><p className="text-xs text-gray-500">Conversations IA</p></div>
        <div className="bg-blue-50 rounded-xl p-3"><p className="text-xl font-bold text-blue-700">{metrics.resolvedWithoutHuman}</p><p className="text-xs text-gray-500">Résolu sans humain</p></div>
        <div className="bg-amber-50 rounded-xl p-3"><p className="text-xl font-bold text-amber-700">{metrics.humanEscalations}</p><p className="text-xs text-gray-500">Escalades humaines</p></div>
        <div className="bg-violet-50 rounded-xl p-3"><p className="text-xl font-bold text-violet-700">{metrics.aiConfidence}%</p><p className="text-xs text-gray-500">Confiance IA</p></div>
        <div className="bg-green-50 rounded-xl p-3"><p className="text-xl font-bold text-green-700">{metrics.resolutionRate}%</p><p className="text-xs text-gray-500">Taux résolution</p></div>
        <div className="bg-gray-50 rounded-xl p-3"><p className="text-xl font-bold">{metrics.costSaved.toLocaleString('fr-FR')} $</p><p className="text-xs text-gray-500">Coût économisé</p></div>
      </div>
    </div>
  );
}
