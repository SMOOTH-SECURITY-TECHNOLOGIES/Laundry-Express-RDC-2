import { useState } from 'react';
import type { WhatsappCost } from '../../../lib/admin/whatsapp-types';

export function CostCenter({ costs }: { costs: WhatsappCost }) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const spark = period === 'day' ? costs.sparklineDay : period === 'week' ? costs.sparklineWeek : costs.sparklineMonth;
  const total = period === 'day' ? costs.totalToday : period === 'week' ? costs.totalWeek : costs.totalMonth;
  const max = Math.max(...spark, 1);
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Cost Center</h3>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={`px-2 py-1 rounded text-xs ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}</button>
          ))}
        </div>
      </div>
      <p className="text-2xl font-bold">{total.toFixed(2)} $</p>
      <p className="text-xs text-gray-500 mb-3">Tendance +{costs.trend}% · Prévision {costs.forecast.toFixed(0)} $</p>
      <div className="flex items-end gap-1 h-16 mb-4">
        {spark.map((v, i) => <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(v / max) * 100}%`, minHeight: 2 }} />)}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-purple-50 p-2 rounded-lg"><p className="text-gray-500">Marketing</p><p className="font-bold">{costs.marketingCost.toFixed(2)} $</p></div>
        <div className="bg-blue-50 p-2 rounded-lg"><p className="text-gray-500">Utility</p><p className="font-bold">{costs.utilityCost.toFixed(2)} $</p></div>
        <div className="bg-green-50 p-2 rounded-lg"><p className="text-gray-500">Auth</p><p className="font-bold">{costs.authCost.toFixed(2)} $</p></div>
      </div>
      <p className="text-xs text-gray-400 mt-3">Coût/conversation : {costs.costPerConversation.toFixed(3)} $</p>
    </div>
  );
}
