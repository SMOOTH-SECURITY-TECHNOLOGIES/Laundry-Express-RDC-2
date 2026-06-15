import { Icon } from '../../Icon';
import type { ReferralWatchlistItem } from '../../../lib/admin/referrals-types';

interface Props {
  open: boolean;
  watchlist: ReferralWatchlistItem[];
  auditResult?: { watchlist_items: number; conversions_audited: number; status: string } | null;
  loading?: boolean;
  onClose: () => void;
  onRunAudit: () => void;
}

export function ReferralAuditDrawer({ open, watchlist, auditResult, loading, onClose, onRunAudit }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg font-bold">Audit parrainage</h2>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <button type="button" onClick={onRunAudit} disabled={loading} className="w-full py-2.5 mb-6 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
          {loading ? 'Audit en cours...' : 'Lancer l\'audit'}
        </button>
        {auditResult && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-xs">
            <p>Statut : <strong>{auditResult.status}</strong></p>
            <p>Conversions auditées : {auditResult.conversions_audited}</p>
            <p>Éléments watchlist : {auditResult.watchlist_items}</p>
          </div>
        )}
        <h3 className="text-sm font-semibold mb-3">Watchlist</h3>
        <div className="space-y-2">
          {watchlist.map((w) => (
            <div key={w.id} className="flex justify-between text-xs border-b pb-2">
              <span>{w.message}</span>
              <span className="font-bold">{w.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
