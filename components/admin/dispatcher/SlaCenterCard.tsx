import React from 'react';
import { Icon } from '../../Icon';
import type { DispatcherSlaData } from '../../../lib/admin/dispatcher-types';

interface SlaCenterCardProps {
  data: DispatcherSlaData;
}

export function SlaCenterCard({ data }: SlaCenterCardProps) {
  const total = data.inSla + data.atRisk + data.breached;
  const overallPercent = total > 0 ? data.inSlaPercent : 94;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="shield-check" className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">SLA Center</h2>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#22c55e"
              strokeWidth="12"
              strokeDasharray={`${(overallPercent / 100) * 314} 314`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-gray-900">{overallPercent}%</span>
            <span className="text-xs text-gray-500">Dans SLA</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <SlaStat label="Dans SLA" value={data.inSla} percent={data.inSlaPercent} color="green" />
        <SlaStat label="À risque" value={data.atRisk} percent={data.atRiskPercent} color="orange" />
        <SlaStat label="Dépassés" value={data.breached} percent={data.breachedPercent} color="red" />
      </div>

      <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100">
        <div className="bg-green-500 h-full" style={{ width: `${data.inSlaPercent}%` }} title={`${data.inSlaPercent}% dans SLA`} />
        <div className="bg-orange-500 h-full" style={{ width: `${data.atRiskPercent}%` }} title={`${data.atRiskPercent}% à risque`} />
        <div className="bg-red-500 h-full" style={{ width: `${data.breachedPercent}%` }} title={`${data.breachedPercent}% dépassé`} />
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        {data.inSlaPercent}% dans SLA · {data.atRiskPercent}% à risque · {data.breachedPercent}% dépassé
      </p>
    </div>
  );
}

function SlaStat({ label, value, percent, color }: { label: string; value: number; percent: number; color: 'green' | 'orange' | 'red' }) {
  const styles = {
    green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' },
    red: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' },
  }[color];

  return (
    <div className={`rounded-xl border p-3 ${styles.bg} ${styles.border}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${styles.text}`}>{value}</p>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div className={`${styles.bar} h-1.5 rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
