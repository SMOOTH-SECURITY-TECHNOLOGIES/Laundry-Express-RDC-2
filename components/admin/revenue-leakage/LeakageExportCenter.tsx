import { Icon } from '../../Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'cases' | 'orphans' | 'commissions' | 'reconciliation' | 'anomalies') => void;
}

export function LeakageExportCenter({ open, onClose, onExport }: Props) {
  if (!open) return null;
  const formats = ['PDF', 'Excel', 'CSV', 'JSON'] as const;
  const scopes = [
    { key: 'cases' as const, label: 'Cas' },
    { key: 'orphans' as const, label: 'Paiements orphelins' },
    { key: 'commissions' as const, label: 'Commissions' },
    { key: 'reconciliation' as const, label: 'Réconciliation' },
    { key: 'anomalies' as const, label: 'Anomalies' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Export Center</h2>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {scopes.map((s) => (
            <div key={s.key}>
              <p className="text-xs font-semibold text-gray-500 mb-2">{s.label}</p>
              <div className="flex flex-wrap gap-2">
                {formats.map((f) => (
                  <button key={f} type="button" onClick={() => onExport(f.toLowerCase() as 'csv' | 'excel' | 'pdf' | 'json', s.key)} className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-gray-50 dark:hover:bg-slate-800">{f}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
