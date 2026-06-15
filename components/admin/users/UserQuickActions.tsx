import { Icon } from '../../Icon';

const ACTIONS = [
  { icon: 'envelope', label: 'Inviter des utilisateurs' },
  { icon: 'document-arrow-down', label: 'Importer utilisateurs' },
  { icon: 'arrow-down-tray', label: 'Exporter liste', action: 'export' },
  { icon: 'shield', label: 'Gérer rôles' },
  { icon: 'user', label: 'Voir inactifs', filter: 'inactive' },
  { icon: 'warning', label: 'Voir suspendus', filter: 'suspended', danger: true },
];

interface Props {
  onExport?: () => void;
  onFilter?: (status: string) => void;
}

export function UserQuickActions({ onExport, onFilter }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="sparkles" className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold">Actions rapides</h3>
      </div>
      <div className="space-y-2">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => {
              if (a.action === 'export') onExport?.();
              if (a.filter) onFilter?.(a.filter);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 text-left ${a.danger ? 'text-red-600' : ''}`}
          >
            <Icon name={a.icon as 'plus'} className="w-4 h-4" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
