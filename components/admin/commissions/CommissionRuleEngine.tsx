import { Icon } from '../../Icon';
import type { CommissionRule } from '../../../lib/admin/commissions-types';

export function CommissionRuleEngine({ rules, onEdit }: { rules: CommissionRule[]; onEdit: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="settings" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Règles de commission</h3></div>
        <button type="button" onClick={onEdit} className="text-xs text-purple-600 font-medium">Modifier →</button>
      </div>
      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{r.label}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400">{r.scope}</p>
            </div>
            <span className="text-lg font-bold text-purple-600">{r.rate} %</span>
          </div>
        ))}
      </div>
    </div>
  );
}
