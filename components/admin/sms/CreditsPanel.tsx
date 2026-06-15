import type { SmsCredits, CreditLedgerItem } from '../../../lib/admin/sms-types';

export function CreditsPanel({ credits, ledger }: { credits: SmsCredits; ledger: CreditLedgerItem[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Gestion crédits SMS</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-violet-50 rounded-xl p-3"><p className="text-2xl font-bold text-violet-700">{credits.currentCredits.toLocaleString('fr-FR')}</p><p className="text-xs text-gray-500">Crédits actuels</p></div>
        <div className="bg-blue-50 rounded-xl p-3"><p className="text-2xl font-bold text-blue-700">{credits.monthlyConsumption.toLocaleString('fr-FR')}</p><p className="text-xs text-gray-500">Consommation mois</p></div>
      </div>
      <p className="text-sm mb-2">Coût moyen/SMS : <strong>{credits.avgCostPerSms.toFixed(3)} $</strong></p>
      <p className="text-sm mb-4">Recharge auto : <span className={credits.autoRecharge ? 'text-green-600' : 'text-gray-500'}>{credits.autoRecharge ? 'Active' : 'Inactive'}</span> · Seuil alerte : {credits.alertThreshold}</p>
      <div className="space-y-2 text-xs">
        <p className="font-semibold text-gray-500">Historique</p>
        {ledger.map((l) => (
          <div key={l.id} className="flex justify-between border-b pb-1">
            <span>{l.movementLabel} {l.note && `— ${l.note}`}</span>
            <span className={l.amount >= 0 ? 'text-green-600' : 'text-red-600'}>{l.amount >= 0 ? '+' : ''}{l.amount.toLocaleString('fr-FR')} → {l.balanceAfter.toLocaleString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
