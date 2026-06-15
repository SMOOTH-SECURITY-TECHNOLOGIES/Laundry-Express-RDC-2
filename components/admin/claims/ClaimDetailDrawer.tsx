import { CLAIMS_WRITE_ENABLED } from '../../../lib/admin/claims-api';
import type { ClaimDetail } from '../../../lib/admin/claims-types';
import { Icon } from '../../Icon';

interface ClaimDetailDrawerProps {
  claim: ClaimDetail | null;
  loading?: boolean;
  onClose: () => void;
  onEscalate: () => void;
  onResolve: () => void;
  onApproveRefund: () => void;
}

export function ClaimDetailDrawer({ claim, loading, onClose, onEscalate, onResolve, onApproveRefund }: ClaimDetailDrawerProps) {
  if (!claim && !loading) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl h-full overflow-y-auto">
        {loading ? (
          <div className="p-8 animate-pulse space-y-4"><div className="h-6 bg-gray-100 rounded" /><div className="h-32 bg-gray-100 rounded" /></div>
        ) : claim && (
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-gray-400">#{claim.claimNumber}</p>
                <h2 className="text-lg font-bold">{claim.title}</h2>
                <p className="text-sm text-gray-500">{claim.statusLabel} • {claim.priorityLabel}</p>
              </div>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><Icon name="xmark" className="w-5 h-5" /></button>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Résumé IA</p>
              <p className="text-sm">{claim.aiSummary}</p>
              <p className="text-xs text-purple-600 mt-2">Risque: {claim.riskScore} — {claim.recommendation}</p>
            </div>
            <div><p className="text-xs text-gray-500 uppercase mb-1">Description</p><p className="text-sm">{claim.description}</p></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Client</span><p className="font-medium">{claim.clientName}</p></div>
              {claim.partnerName && <div><span className="text-gray-500">Partenaire</span><p className="font-medium">{claim.partnerName}</p></div>}
              {claim.driverName && <div><span className="text-gray-500">Chauffeur</span><p className="font-medium">{claim.driverName}</p></div>}
              <div><span className="text-gray-500">SLA</span><p className="font-medium">{claim.slaLabel}</p></div>
            </div>
            {claim.timeline.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Timeline</p>
                <ul className="space-y-2">{claim.timeline.map((t, i) => (
                  <li key={i} className="text-xs border-l-2 border-purple-200 pl-3"><span className="font-medium">{t.event}</span> — {t.detail}<br /><span className="text-gray-400">{t.date}</span></li>
                ))}</ul>
              </div>
            )}
            {CLAIMS_WRITE_ENABLED && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <button type="button" onClick={onEscalate} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm">Escalader</button>
                <button type="button" onClick={onResolve} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">Résoudre</button>
                <button type="button" onClick={onApproveRefund} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm">Approuver remboursement</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
