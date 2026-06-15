import type { RbacRiskAlert } from '../../../lib/admin/rbac-types';

const SEV: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700', warning: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700',
};

export function RiskAlertsPanel({ alerts }: { alerts: RbacRiskAlert[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Alertes & risques sécurité</h3></div>
      <div className="divide-y">
        {alerts.map((a) => (
          <div key={a.id} className="px-4 py-3 flex justify-between items-start gap-2">
            <div>
              <p className="text-sm font-medium">{a.title}</p>
              {a.userEmail && <p className="text-xs text-gray-500">{a.userEmail}</p>}
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${SEV[a.severity] || 'bg-gray-100'}`}>{a.severityLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
