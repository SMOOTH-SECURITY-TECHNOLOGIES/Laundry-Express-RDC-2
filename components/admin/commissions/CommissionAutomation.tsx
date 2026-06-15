import { Icon } from '../../Icon';
import type { CommissionAutomation as AutomationType } from '../../../lib/admin/commissions-types';

const OPTIONS: { key: keyof AutomationType; label: string }[] = [
  { key: 'autoCalculate', label: 'Calcul automatique' },
  { key: 'autoValidate', label: 'Validation automatique' },
  { key: 'autoInvoice', label: 'Facturation automatique' },
  { key: 'autoPay', label: 'Paiement automatique' },
  { key: 'autoFollowUp', label: 'Relance automatique' },
];

export function CommissionAutomation({ automation, onToggle }: { automation: AutomationType; onToggle: (key: keyof AutomationType) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="settings" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Commission Automation</h3></div>
      <div className="space-y-3">
        {OPTIONS.map((o) => (
          <label key={o.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800 cursor-pointer">
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{o.label}</span>
            <button type="button" role="switch" aria-checked={automation[o.key]} onClick={() => onToggle(o.key)} className={`relative w-10 h-5 rounded-full transition-colors ${automation[o.key] ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${automation[o.key] ? 'left-5' : 'left-0.5'}`} />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
