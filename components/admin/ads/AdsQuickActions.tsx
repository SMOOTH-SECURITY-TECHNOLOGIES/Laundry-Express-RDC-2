import { Icon } from '../../Icon';

interface Props {
  onCreateAd: () => void;
  onCreateCampaign: () => void;
  onExport: () => void;
}

export function AdsQuickActions({ onCreateAd, onCreateCampaign, onExport }: Props) {
  const actions = [
    { label: 'Créer publicité', icon: 'plus', onClick: onCreateAd, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Créer campagne', icon: 'paper-plane', onClick: onCreateCampaign, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { label: 'Lancer A/B Test', icon: 'chartBar', onClick: onCreateCampaign, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
    { label: 'Exporter rapport', icon: 'arrow-down-tray', onClick: onExport, color: 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="fire" className="w-5 h-5 text-yellow-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Actions rapides</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${a.color}`}>
            <Icon name={a.icon as 'plus'} className="w-4 h-4" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
