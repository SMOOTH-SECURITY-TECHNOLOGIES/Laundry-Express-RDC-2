import { Icon } from '../../Icon';
import type { FraudSignal } from '../../../lib/admin/payments-types';

const riskStyle: Record<string, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const riskLabel: Record<string, string> = { low: 'Faible', medium: 'Moyen', high: 'Elevé' };

export function PaymentsFraudCard({ signals, onInvestigate }: { signals: FraudSignal[]; onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="warning" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Détection fraude</h3></div>
      <div className="space-y-2">
        {signals.map((s) => (
          <button key={s.id} type="button" onClick={() => onInvestigate(s.id)} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-left">
            <div><p className="text-xs font-medium text-gray-900 dark:text-slate-100">{s.label}</p><p className="text-[10px] text-gray-500">{s.count} signal{s.count > 1 ? 's' : ''} · Score {s.score}</p></div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskStyle[s.risk]}`}>{riskLabel[s.risk]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
