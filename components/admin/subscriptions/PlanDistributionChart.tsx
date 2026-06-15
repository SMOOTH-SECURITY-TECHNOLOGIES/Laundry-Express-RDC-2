const segments = [
  { label: "Essentiel", count: 58, percentage: 45, color: "#6366f1" },
  { label: "Professionnel", count: 48, percentage: 37, color: "#8b5cf6" },
  { label: "Entreprise", count: 22, percentage: 18, color: "#f59e0b" },
];

const total = 128;

export function PlanDistributionChart() {
  const radius = 80;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-6">
        Distribution des plans
      </h3>

      <div className="flex items-center justify-between gap-8">
        <div className="relative flex-shrink-0">
          <svg width={200} height={200} viewBox="0 0 200 200">
            {segments.map((segment, index) => {
              const strokeDasharray = (segment.percentage / 100) * circumference;
              const strokeDashoffset = (-cumulativePercentage / 100) * circumference;
              cumulativePercentage += segment.percentage;

              return (
                <circle
                  key={segment.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeDasharray} ${circumference - strokeDasharray}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 100 100)"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{total}</span>
            <span className="text-sm text-gray-500">Total</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {segment.label}
                </span>
                <span className="text-xs text-gray-500">
                  {segment.count} ({segment.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
