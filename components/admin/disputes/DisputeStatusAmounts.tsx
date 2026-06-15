import type { DisputeStatusAmount } from '../../../lib/admin/disputes-types';

interface DisputeStatusAmountsProps {
  items: DisputeStatusAmount[];
}

export function DisputeStatusAmounts({ items }: DisputeStatusAmountsProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-slate-600 w-28 shrink-0">{item.label}</span>
          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-800 w-20 text-right shrink-0">
            ${item.amount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 w-10 text-right shrink-0">{item.percentage}%</span>
        </div>
      ))}
    </div>
  );
}
