import type { AuditItem } from '../../../lib/admin/subscriptions-types';

const statusStyles: Record<string, { bg: string; text: string; ring: string }> = {
  healthy: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20' },
  warning: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20' },
};

export function SubscriptionAudit({ items }: { items: AuditItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Conformité Audit</h3>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const s = statusStyles[item.status] || statusStyles.healthy;
          return (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ring-4 ${s.ring} ${item.status === 'healthy' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className={`text-lg font-bold ${s.text}`}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
