import type { DisputeSlaSummary } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface DisputeSlaCardProps {
  sla: DisputeSlaSummary;
}

export function DisputeSlaCard({ sla }: DisputeSlaCardProps) {
  const total = sla.inTime + sla.atRisk + sla.outOfSla;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const inTimeOffset = circumference - (sla.inTimePercent / 100) * circumference;
  const atRiskOffset = circumference - (sla.atRiskPercent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider self-start">
        SLA des litiges
      </h3>

      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={inTimeOffset}
            strokeLinecap="round"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={atRiskOffset}
            strokeLinecap="round"
            style={{ transform: `rotate(${(sla.inTimePercent / 100) * 360}deg)`, transformOrigin: '60px 60px' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{sla.inTimePercent}%</span>
          <span className="text-xs text-gray-500">dans les temps</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Dans les temps</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{sla.inTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-600">À risque</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{sla.atRisk}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">Hors SLA</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{sla.outOfSla}</span>
        </div>
      </div>

      <div className="w-full pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Icon name="clock" className="w-3.5 h-3.5" />
        <span>Total: {total} litiges</span>
      </div>
    </div>
  );
}
