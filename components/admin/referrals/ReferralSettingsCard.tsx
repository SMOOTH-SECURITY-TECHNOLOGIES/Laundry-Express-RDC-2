import { Icon } from '../../Icon';
import { REFERRALS_WRITE_ENABLED } from '../../../lib/admin/referrals-api';
import type { ReferralSettings } from '../../../lib/admin/referrals-types';

const CHANNEL_OPTS = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'link', label: 'Link' },
];

interface Props {
  settings: ReferralSettings;
  onChange: (s: ReferralSettings) => void;
  onSave: () => void;
  onHistory?: () => void;
  saving?: boolean;
}

export function ReferralSettingsCard({ settings, onChange, onSave, onHistory, saving }: Props) {
  const set = (patch: Partial<ReferralSettings>) => onChange({ ...settings, ...patch });
  const toggleChannel = (ch: string) => {
    const next = settings.allowedChannels.includes(ch)
      ? settings.allowedChannels.filter((c) => c !== ch)
      : [...settings.allowedChannels, ch];
    set({ allowedChannels: next });
  };
  const disabled = !REFERRALS_WRITE_ENABLED;
  const tip = disabled ? 'Les actions d\'écriture seront activées lorsque les contrats API seront alignés.' : undefined;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="settings" className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold">Configuration du programme de parrainage</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.isEnabled} disabled={disabled} title={tip} onChange={(e) => set({ isEnabled: e.target.checked })} />
            Statut du programme : {settings.isEnabled ? 'Actif' : 'Inactif'}
          </label>
          <Field label="Bonus parrain (points)" value={settings.referrerBonusPoints} disabled={disabled} tip={tip} onChange={(v) => set({ referrerBonusPoints: v, referrerConversionBonus: v })} />
          <Field label="Réduction filleul ($)" value={settings.refereeDiscountAmount} disabled={disabled} tip={tip} step={0.01} onChange={(v) => set({ refereeDiscountAmount: v })} />
          <Field label="Points bonus au parrain après conversion" value={settings.referrerConversionBonus} disabled={disabled} tip={tip} onChange={(v) => set({ referrerConversionBonus: v, referrerBonusPoints: v })} />
          <Field label="Points bonus au filleul après conversion" value={settings.refereeConversionBonus} disabled={disabled} tip={tip} onChange={(v) => set({ refereeConversionBonus: v })} />
        </div>
        <div className="space-y-3">
          <Field label="Expiration des points (jours)" value={settings.pointsExpiryDays ?? 0} disabled={disabled} tip={tip} onChange={(v) => set({ pointsExpiryDays: v || null })} />
          <Field label="Plafond bonus par parrain" value={settings.bonusCapPerReferrer ?? 0} disabled={disabled} tip={tip} onChange={(v) => set({ bonusCapPerReferrer: v || null })} />
          <div>
            <p className="text-xs text-gray-500 mb-2">Canaux autorisés</p>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  disabled={disabled}
                  title={tip}
                  onClick={() => toggleChannel(c.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${settings.allowedChannels.includes(c.key) ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onHistory} className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50">Historique des paramètres</button>
        <button type="button" onClick={onSave} disabled={saving || disabled} title={tip} className="px-4 py-2 text-xs bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled, tip, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; disabled?: boolean; tip?: string; step?: number;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        disabled={disabled}
        title={tip}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="w-full px-2 py-1.5 rounded-lg border text-sm dark:bg-slate-800 dark:border-slate-600 disabled:opacity-60"
      />
    </div>
  );
}
