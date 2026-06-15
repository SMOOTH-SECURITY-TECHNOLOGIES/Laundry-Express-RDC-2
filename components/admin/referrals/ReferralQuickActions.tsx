import { Icon } from '../../Icon';
import { REFERRALS_WRITE_ENABLED } from '../../../lib/admin/referrals-api';

interface Props {
  onCreateCampaign: () => void;
  onManualBonus: () => void;
  onExport: () => void;
  onWatchlist: () => void;
  onPromotion: () => void;
  onAudit: () => void;
}

export function ReferralQuickActions({ onCreateCampaign, onManualBonus, onExport, onWatchlist, onPromotion, onAudit }: Props) {
  const tip = 'Les actions d\'écriture seront activées lorsque les contrats API seront alignés.';
  const actions = [
    { label: 'Créer campagne parrainage', icon: 'plus', onClick: onCreateCampaign, write: true },
    { label: 'Envoyer bonus manuellement', icon: 'gift', onClick: onManualBonus, write: true },
    { label: 'Exporter rapport', icon: 'arrow-down-tray', onClick: onExport, write: false },
    { label: 'Voir watchlist', icon: 'shield', onClick: onWatchlist, write: false },
    { label: 'Créer promotion liée', icon: 'tag', onClick: onPromotion, write: false },
    { label: 'Auditer conversions', icon: 'magnifying-glass-plus', onClick: onAudit, write: true },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="fire" className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold">Actions rapides</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((a) => {
          const disabled = a.write && !REFERRALS_WRITE_ENABLED;
          return (
            <button
              key={a.label}
              type="button"
              disabled={disabled}
              title={disabled ? tip : undefined}
              onClick={a.onClick}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left"
            >
              <Icon name={a.icon as 'plus'} className="w-4 h-4 text-purple-600 shrink-0" />
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
