import { Icon } from '../../Icon';
import type { TopReferrer } from '../../../lib/admin/referrals-types';

interface Props {
  referrer: TopReferrer | null;
  onClose: () => void;
}

export function ReferralDetailDrawer({ referrer, onClose }: Props) {
  if (!referrer) return null;

  const timeline = [
    { date: 'Récent', event: `${referrer.conversions} conversions complètes` },
    { date: 'Actif', event: `${referrer.referees} filleuls inscrits` },
    { date: 'Bonus', event: `${referrer.bonusPoints.toLocaleString('fr-FR')} pts attribués` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold">{referrer.name}</h2>
            <p className="text-sm text-gray-500">{referrer.email}</p>
            <p className="text-xs font-mono mt-1 text-purple-600">{referrer.referralCode}</p>
          </div>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
          <Stat label="Filleuls" value={String(referrer.referees)} />
          <Stat label="Conversions" value={String(referrer.conversions)} />
          <Stat label="Points attribués" value={`${referrer.bonusPoints.toLocaleString('fr-FR')} pts`} />
          <Stat label="Revenus générés" value={`${referrer.revenueGenerated.toLocaleString('fr-FR')} $`} />
        </div>
        <h3 className="text-sm font-semibold mb-3">Timeline</h3>
        <div className="space-y-3 mb-6">
          {timeline.map((t) => (
            <div key={t.event} className="flex gap-3 text-xs">
              <span className="text-gray-400 w-16 shrink-0">{t.date}</span>
              <span>{t.event}</span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs">
          <Icon name="shield" className="w-4 h-4 text-amber-600 inline mr-1" />
          Aucune anomalie critique détectée pour ce parrain.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
      <p className="text-gray-500">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  );
}
