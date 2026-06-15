import { Icon } from '../../Icon';

const CORRIDORS = ['Commande', 'Paiement', 'Commission', 'Livraison', 'Support', 'Client', 'Partenaire'];

export function RefundInvestigationPanel({ refundId, onOpenInvestigate }: { refundId?: string; onOpenInvestigate: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="search" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Refund Investigation</h3></div>
        {refundId && <span className="text-xs text-purple-600 font-medium">{refundId}</span>}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {CORRIDORS.map((c) => (
          <span key={c} className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-[10px] font-medium">{c}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {[
          { label: 'Demandeur', value: 'Client' },
          { label: 'Motif', value: 'Retard livraison' },
          { label: 'Montant', value: '85 $' },
          { label: 'Décision', value: 'En investigation' },
          { label: 'Responsable', value: 'Admin Finance' },
        ].map((i) => (
          <div key={i.label} className="rounded-xl bg-gray-50 dark:bg-slate-800 p-2"><p className="text-gray-500 dark:text-slate-400">{i.label}</p><p className="font-medium text-gray-900 dark:text-slate-100">{i.value}</p></div>
        ))}
      </div>
      <button type="button" onClick={onOpenInvestigate} className="mt-4 w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">Ouvrir enquête complète</button>
    </div>
  );
}
