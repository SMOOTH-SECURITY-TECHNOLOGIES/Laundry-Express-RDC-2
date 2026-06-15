import { useState } from 'react';
import type { CashFlow } from '../../../lib/admin/payment-gateways-types';

export function CashFlowWidget({ cashFlow }: { cashFlow: CashFlow }) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const spark = period === '7d' ? cashFlow.sparkline7d : period === '30d' ? cashFlow.sparkline30d : cashFlow.sparkline90d;
  const max = Math.max(...spark, 1);
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">Flux de cash</h3>
        <div className="flex gap-1">{(['7d', '30d', '90d'] as const).map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)} className={`px-2 py-1 rounded-lg text-xs ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{p}</button>
        ))}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><p className="text-gray-500 text-xs">Cash reçu</p><p className="font-bold text-green-600">{cashFlow.cashReceived.toLocaleString('fr-FR')} $</p></div>
        <div><p className="text-gray-500 text-xs">Cash retiré</p><p className="font-bold text-red-600">-{cashFlow.cashWithdrawn.toLocaleString('fr-FR')} $</p></div>
        <div><p className="text-gray-500 text-xs">Cash en transit</p><p className="font-bold text-amber-600">{cashFlow.cashInTransit.toLocaleString('fr-FR')} $</p></div>
        <div><p className="text-gray-500 text-xs">Cash net</p><p className="font-bold">{cashFlow.cashNet.toLocaleString('fr-FR')} $</p></div>
      </div>
      {spark.length > 0 && (
        <div className="flex items-end gap-1 h-16">
          {spark.map((v, i) => <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(v / max) * 100}%`, minHeight: 4 }} />)}
        </div>
      )}
    </div>
  );
}
