import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { PaymentTrendPeriod, PaymentTrendPoint } from '../../../lib/admin/payments-types';

const PERIODS: { id: PaymentTrendPeriod; label: string }[] = [
  { id: '24h', label: '24h' }, { id: '7d', label: '7j' }, { id: '30d', label: '30j' }, { id: '90d', label: '90j' }, { id: '1y', label: '1 an' },
];

export function PaymentsTrendChart({ trend }: { trend: Record<PaymentTrendPeriod, PaymentTrendPoint[]> }) {
  const [period, setPeriod] = useState<PaymentTrendPeriod>('7d');
  const points = trend[period] ?? [];
  const max = Math.max(...points.flatMap((p) => [p.amount, p.transactions * 10]));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="chartBar" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Tendances paiements</h3></div>
        <div className="flex gap-1">{PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`px-2 py-1 rounded-lg text-[10px] font-medium ${period === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'}`}>{p.label}</button>
        ))}</div>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {points.map((p) => (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col gap-0.5 items-center" style={{ height: '100%' }}>
              <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${(p.amount / max) * 80}%`, minHeight: 2 }} title={`${p.amount} $`} />
              <div className="w-full bg-green-400 rounded-t-sm" style={{ height: `${(p.transactions * 10 / max) * 60}%`, minHeight: 1 }} title={`${p.transactions} tx`} />
            </div>
            <span className="text-[8px] text-gray-400 truncate w-full text-center">{p.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm" /> Montant encaissé</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-sm" /> Transactions</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-400 rounded-sm" /> Taux réussite</span>
      </div>
    </div>
  );
}
