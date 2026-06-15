import { Icon } from '../../Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope: string) => void;
}

export function LoyaltyExportCenter({ open, onClose, onExport }: Props) {
  if (!open) return null;
  const formats = ['PDF', 'Excel', 'CSV', 'JSON'] as const;
  const scopes = ['activity', 'users', 'rewards', 'cohorts', 'segments'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">Export Center</h2><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        {scopes.map((s) => (
          <div key={s} className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 capitalize">{s}</p>
            <div className="flex flex-wrap gap-2">{formats.map((f) => (
              <button key={f} type="button" onClick={() => onExport(f.toLowerCase() as 'csv' | 'excel' | 'pdf' | 'json', s)} className="px-3 py-1.5 rounded-lg text-xs border hover:bg-gray-50">{f}</button>
            ))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
