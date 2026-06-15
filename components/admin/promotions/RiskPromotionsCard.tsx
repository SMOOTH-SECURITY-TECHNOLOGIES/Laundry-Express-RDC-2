import { Icon } from '../../Icon';
import type { RiskPromotion } from '../../../lib/admin/promotions-types';

const levelStyle = { high: 'bg-red-100 text-red-700 border-red-200', medium: 'bg-orange-100 text-orange-700 border-orange-200', low: 'bg-yellow-100 text-yellow-700 border-yellow-200' };

export function RiskPromotionsCard({ risks, onAction }: { risks: RiskPromotion[]; onAction: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="warning" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Promotions à risque</h3></div>
      <div className="space-y-2">{risks.map((r) => (
        <button key={r.id} type="button" onClick={() => onAction(r.id)} className={`w-full text-left rounded-xl border p-3 ${levelStyle[r.level]}`}>
          <div className="flex justify-between"><span className="font-mono font-bold text-sm">{r.code}</span><span className="text-[10px] font-bold uppercase">{r.level === 'high' ? 'Élevé' : r.level === 'medium' ? 'Moyen' : 'Faible'}</span></div>
          <p className="text-xs mt-1 font-medium">{r.issue}</p>
          <p className="text-[10px] mt-0.5 opacity-80">{r.impact}</p>
        </button>
      ))}</div>
    </div>
  );
}
