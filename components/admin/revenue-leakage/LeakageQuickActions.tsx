import { Icon } from '../../Icon';

export function LeakageQuickActions({ onInvestigate, onAssign, onExport, onAdjust }: {
  onInvestigate: () => void;
  onAssign: () => void;
  onExport: () => void;
  onAdjust: () => void;
}) {
  const actions = [
    { label: 'Investiguer un cas', icon: 'magnifying-glass-plus' as const, onClick: onInvestigate, color: 'bg-purple-600 text-white' },
    { label: 'Créer un ajustement', icon: 'plus' as const, onClick: onAdjust, color: 'bg-blue-600 text-white' },
    { label: 'Assigner un cas', icon: 'users' as const, onClick: onAssign, color: 'border border-gray-300 dark:border-slate-600' },
    { label: 'Exporter rapport', icon: 'arrow-down-tray' as const, onClick: onExport, color: 'border border-gray-300 dark:border-slate-600' },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="sparkles" className="w-5 h-5 text-yellow-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Actions rapides</h3></div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium ${a.color} hover:opacity-90`}>
            <Icon name={a.icon} className="w-4 h-4" />{a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
