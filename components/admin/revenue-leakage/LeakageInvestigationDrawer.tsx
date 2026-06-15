import { Icon } from '../../Icon';
import type { LeakageInvestigationDetail } from '../../../lib/admin/revenue-leakage-types';

export function LeakageInvestigationDrawer({ detail, onClose, onInvestigate }: {
  detail: LeakageInvestigationDetail | null;
  onClose: () => void;
  onInvestigate: (id: string) => void;
}) {
  if (!detail) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Investigation — {detail.caseId}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs mb-6">
          {[
            { label: 'Commande', value: detail.orderId },
            { label: 'Paiement', value: detail.paymentId || '—' },
            { label: 'Commission', value: detail.commissionId || 'Absente' },
            { label: 'Facture', value: detail.invoiceId || '—' },
            { label: 'Remboursement', value: detail.refundId || '—' },
            { label: 'Statut', value: detail.status },
            { label: 'Assigné', value: detail.assignee || '—' },
          ].map((i) => (
            <div key={i.label} className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3"><p className="text-gray-500">{i.label}</p><p className="font-bold text-gray-900 dark:text-slate-100 mt-1">{i.value}</p></div>
          ))}
        </div>
        <h3 className="text-sm font-semibold mb-2">Timeline</h3>
        <div className="space-y-2 mb-6">{detail.timeline.map((t) => (
          <div key={t.id} className="text-xs border-l-2 border-blue-300 pl-3 py-1"><p className="font-medium">{t.label}</p><p className="text-gray-500">{t.time}</p></div>
        ))}</div>
        <h3 className="text-sm font-semibold mb-2">Logs</h3>
        <div className="space-y-1 mb-6">{detail.logs.map((l, i) => (
          <p key={i} className="text-[10px] text-gray-600 dark:text-slate-400 font-mono">{l.time} — {l.message}</p>
        ))}</div>
        <button type="button" onClick={() => onInvestigate(detail.orderId)} className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold">Investiguer dans Order Truth</button>
      </div>
    </div>
  );
}
