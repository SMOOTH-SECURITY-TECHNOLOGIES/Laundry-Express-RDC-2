import React, { useState } from 'react';
import { Icon } from '../../Icon';

const SEARCH_TYPES = ['Order ID', 'Payment ID', 'Commission ID', 'Partner ID', 'Invoice ID'];

export function CommissionInvestigatePanel({ onInvestigate }: { onInvestigate: (query: string, type: string) => void }) {
  const [searchType, setSearchType] = useState(SEARCH_TYPES[0]);
  const [query, setQuery] = useState('');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="magnifying-glass-plus" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Investigate Commission Flow</h3></div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">{SEARCH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex: COM-8821, ORD-7845..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm" />
        <button type="button" onClick={() => query && onInvestigate(query, searchType)} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">Rechercher</button>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2">Timeline : Order Created → Payment Received → Commission Generated → Approved → Paid</p>
    </div>
  );
}
