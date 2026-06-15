import { Icon } from '../../Icon';
import type { SecurityAlert } from '../../../lib/admin/admin-mgmt-types';

const sev: Record<string, string> = { info: 'text-blue-600', warning: 'text-amber-600', critical: 'text-red-600' };

export function SecurityAlertsPanel({ alerts }: { alerts: SecurityAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-3">Alertes Sécurité</h3>
      <div className="space-y-2">{alerts.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-sm">
          <Icon name="warning" className={`w-4 h-4 ${sev[a.severity] || 'text-amber-600'}`} />
          <span>{a.title}</span><span className="text-gray-400">({a.count})</span>
        </div>
      ))}</div>
    </div>
  );
}
