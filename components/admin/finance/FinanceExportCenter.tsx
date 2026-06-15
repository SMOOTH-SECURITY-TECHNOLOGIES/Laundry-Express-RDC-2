import React, { useState } from 'react';
import { Icon } from '../../Icon';

const FORMATS = [
  { id: 'pdf' as const, label: 'PDF' },
  { id: 'excel' as const, label: 'Excel' },
  { id: 'csv' as const, label: 'CSV' },
  { id: 'json' as const, label: 'JSON' },
];

const SCOPES = [
  { id: 'finance' as const, label: 'Finance' },
  { id: 'marketplace' as const, label: 'Marketplace' },
  { id: 'logistics' as const, label: 'Logistique' },
  { id: 'truth' as const, label: 'Truth' },
  { id: 'support' as const, label: 'Support' },
];

interface FinanceExportCenterProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'finance' | 'marketplace' | 'logistics' | 'truth' | 'support') => void;
}

export function FinanceExportCenter({ open, onClose, onExport }: FinanceExportCenterProps) {
  const [scope, setScope] = useState<'finance' | 'marketplace' | 'logistics' | 'truth' | 'support'>('finance');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 border dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Export Center</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Filtres : Zone · Partenaire · Date · Service</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {SCOPES.map((s) => (
            <button key={s.id} type="button" onClick={() => setScope(s.id)} className={`px-2 py-1 rounded-lg text-[10px] font-medium ${scope === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'}`}>{s.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} type="button" onClick={() => { onExport(f.id, scope); onClose(); }} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-100">
              <Icon name="arrow-down-tray" className="w-4 h-4" /> {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
