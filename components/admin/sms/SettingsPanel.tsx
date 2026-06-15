import type { SmsSettings } from '../../../lib/admin/sms-types';

export function SettingsPanel({ settings }: { settings: SmsSettings }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Paramètres SMS</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span>Expéditeur par défaut</span><strong>{settings.defaultSender}</strong></div>
        <div className="flex justify-between"><span>Recharge automatique</span><span className={settings.autoRecharge ? 'text-green-600' : 'text-gray-500'}>{settings.autoRecharge ? 'Active' : 'Inactive'}</span></div>
        <div className="flex justify-between"><span>Seuil alerte crédits</span><strong>{settings.alertThreshold} SMS</strong></div>
        <div><p className="text-gray-500 mb-1">Providers actifs</p><div className="flex flex-wrap gap-1">{settings.providers.map((p) => <span key={p} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{p}</span>)}</div></div>
      </div>
    </div>
  );
}
