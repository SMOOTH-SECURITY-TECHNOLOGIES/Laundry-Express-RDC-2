import { Icon } from '../../Icon';
import type { EscalationItem } from '../../../lib/admin/support-types';

const SEV: Record<string, string> = { high: 'border-red-200 bg-red-50 text-red-700', medium: 'border-orange-200 bg-orange-50 text-orange-700', low: 'border-yellow-200 bg-yellow-50' };

export function SupportEscalationCenter({ items }: { items: EscalationItem[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="warning" className="w-5 h-5 text-red-600" /><h3 className="text-sm font-semibold">Escalade &amp; risques</h3></div>
      <div className="space-y-2">{items.map((i) => (
        <div key={i.id} className={`flex justify-between items-center p-3 rounded-xl border text-xs ${SEV[i.severity] ?? ''}`}>
          <span>{i.label}</span><span className="font-bold text-lg">{i.count}</span>
        </div>
      ))}</div>
    </div>
  );
}
