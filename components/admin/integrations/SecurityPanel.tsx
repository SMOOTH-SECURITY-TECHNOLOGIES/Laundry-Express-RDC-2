import type { SecurityMetrics } from '../../../lib/admin/integrations-types';

export function SecurityPanel({ security }: { security: SecurityMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-4">API Keys</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold">{security.apiKeysTotal}</p><p className="text-xs text-gray-500">Total</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold text-amber-600">{security.apiKeysExpired}</p><p className="text-xs text-gray-500">Expirées</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold text-red-600">{security.apiKeysRevoked}</p><p className="text-xs text-gray-500">Révoquées</p></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-4">Webhooks</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold text-green-600">{security.webhooksSigned}</p><p className="text-xs text-gray-500">Signés</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold text-amber-600">{security.webhooksUnsigned}</p><p className="text-xs text-gray-500">Non signés</p></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-5 md:col-span-2">
        <h3 className="font-semibold mb-4">Audit Trail</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold">{security.auditAccessCount.toLocaleString('fr-FR')}</p><p className="text-xs text-gray-500">Accès</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold">{security.auditModifications}</p><p className="text-xs text-gray-500">Modifications</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xl font-bold text-red-600">{security.auditDeletions}</p><p className="text-xs text-gray-500">Suppressions</p></div>
        </div>
      </div>
    </div>
  );
}
