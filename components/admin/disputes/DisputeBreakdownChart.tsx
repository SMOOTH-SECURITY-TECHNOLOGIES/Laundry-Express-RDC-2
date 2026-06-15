import type { DisputeBreakdownItem } from '../../../lib/admin/disputes-types';

interface DisputeBreakdownChartProps {
  items: DisputeBreakdownItem[];
}

export function DisputeBreakdownChart({ items }: DisputeBreakdownChartProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const radius = 80;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  const segments = items.map((item) => {
    const segmentLength = (item.percentage / 100) * circumference;
    const offset = circumference - cumulativeOffset;
    cumulativeOffset += segmentLength;

    return {
      ...item,
      segmentLength,
      offset,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((segment) => (
            <circle
              key={segment.name}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.segmentLength} ${circumference - segment.segmentLength}`}
              strokeDashoffset={segment.offset}
              transform="rotate(-90 100 100)"
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800">{total}</span>
          <span className="text-sm text-slate-500">Total</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-slate-600">{item.name}</span>
            <span className="text-sm font-medium text-slate-800 ml-auto whitespace-nowrap">
              {item.count} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
