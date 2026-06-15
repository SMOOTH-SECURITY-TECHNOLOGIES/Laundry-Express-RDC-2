import { Icon } from '../../Icon';
import type { AiTriageItem } from '../../../lib/admin/support-types';

export function SupportAiTriage({ items }: { items: AiTriageItem[] }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="sparkles" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-purple-700">AI Support Triage</h3></div>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.ticketId} className="p-3 rounded-xl bg-purple-50 text-xs">
            <div className="flex justify-between mb-1"><span className="font-mono text-purple-600">{i.ticketCode}</span><span className="text-red-600 font-medium">{i.priority}</span></div>
            <p className="font-medium">{i.subject}</p>
            <p className="text-gray-500">{i.clientName} — {i.sentiment} — {i.predictedCategory}</p>
            <div className="flex gap-2 mt-2"><Badge label={`Remb. ${i.refundRisk}`} /><Badge label={`Churn ${i.churnRisk}`} /></div>
            <p className="mt-2 italic text-gray-600">&quot;{i.suggestedReply}&quot;</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="px-2 py-0.5 rounded-full bg-white border text-[10px]">{label}</span>;
}
