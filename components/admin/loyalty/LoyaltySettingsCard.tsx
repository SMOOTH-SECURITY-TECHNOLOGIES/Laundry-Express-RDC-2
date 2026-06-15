import { Icon } from '../../Icon';
import type { LoyaltySettingsCard as Settings } from '../../../lib/admin/loyalty-types';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onSave: () => void;
  onRunExpiration: () => void;
  saving?: boolean;
  runningExpiry?: boolean;
}

export function LoyaltySettingsCard({ settings, onChange, onSave, onRunExpiration, saving, runningExpiry }: Props) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="settings" className="w-5 h-5 text-gray-600" /><h3 className="text-sm font-semibold">Paramètres du programme</h3></div>
      <label className="flex items-center gap-2 mb-4 text-sm">
        <input type="checkbox" checked={settings.isEnabled} onChange={(e) => set({ isEnabled: e.target.checked })} />
        Activer programme fidélité
      </label>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="Taux de gain (pts/$)" value={settings.pointsPerDollar} onChange={(v) => set({ pointsPerDollar: v })} />
        <Field label="Taux d'échange (pts/$)" value={settings.pointsToDollar} onChange={(v) => set({ pointsToDollar: v })} />
        <Field label="Expiration (jours)" value={settings.pointsExpiryDays ?? 0} onChange={(v) => set({ pointsExpiryDays: v || null })} />
        <Field label="Plafond redemption" value={settings.redemptionCap ?? 0} onChange={(v) => set({ redemptionCap: v || null })} />
        <Field label="Bonus 1ère commande" value={settings.firstOrderBonus} onChange={(v) => set({ firstOrderBonus: v })} />
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onRunExpiration} disabled={runningExpiry} className="px-3 py-2 text-xs border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 disabled:opacity-60">
          {runningExpiry ? 'Expiration...' : 'Run expiration now'}
        </button>
        <button type="button" onClick={onSave} disabled={saving} className="px-4 py-2 text-xs bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-gray-500 block mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} className="w-full px-2 py-1.5 rounded-lg border dark:bg-slate-800 dark:border-slate-600" />
    </div>
  );
}
