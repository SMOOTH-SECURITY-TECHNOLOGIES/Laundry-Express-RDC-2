import { Icon } from '../../Icon';
import type { SecuritySummary } from '../../../lib/admin/users-types';

export function UserSecurityCard({ security }: { security: SecuritySummary }) {
  const items = [
    { label: 'Double authentification', value: `${security.twoFaEnabledPercent}%`, icon: 'shield' as const, color: 'text-green-600' },
    { label: 'Comptes vérifiés', value: `${security.verifiedAccountsPercent}%`, icon: 'badge-check' as const, color: 'text-blue-600' },
    { label: 'Comptes non vérifiés', value: `${security.unverifiedAccountsPercent}%`, icon: 'warning' as const, color: 'text-orange-600' },
    { label: 'Connexions suspectes', value: String(security.suspiciousLogins), icon: 'shield' as const, color: 'text-red-600' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="shield" className="w-5 h-5 text-red-600" />
        <h3 className="text-sm font-semibold">Sécurité des comptes</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs">
            <div className="flex items-center gap-1 mb-1">
              <Icon name={i.icon} className={`w-3.5 h-3.5 ${i.color}`} />
              <span className="text-gray-500">{i.label}</span>
            </div>
            <p className="text-lg font-bold">{i.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
