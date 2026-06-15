import { Icon } from '../../Icon';
import { REVIEWS_WRITE_ENABLED } from '../../../lib/admin/reviews-api';
import type { ReviewDetail } from '../../../lib/admin/reviews-types';

export function ReviewDetailDrawer({ review, loading, onClose, onReply, onEscalate, onReport }: {
  review: ReviewDetail | null; loading?: boolean; onClose: () => void;
  onReply?: (c: string) => void; onEscalate?: () => void; onReport?: () => void;
}) {
  if (!review && !loading) return null;
  const readOnly = !REVIEWS_WRITE_ENABLED;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto">
        {loading ? <div className="p-6 animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-2/3" /><div className="h-32 bg-gray-100 rounded-xl" /></div> : review && (
          <div className="p-6">
            <div className="flex justify-between mb-4">
              <div><h2 className="text-lg font-bold">{review.clientName}</h2><p className="text-xs text-gray-500">{review.reviewTypeLabel} • {review.source} • {'★'.repeat(review.rating)}</p></div>
              <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-xs mb-4"><Icon name="sparkles" className="w-4 h-4 text-purple-600 inline mr-1" /><strong>IA :</strong> {review.aiSummary}</div>
            <p className="text-sm mb-4">{review.comment}</p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <Stat label="Sentiment" value={review.sentiment} />
              <Stat label="Risque churn" value={review.churnRisk} />
              <Stat label="Priorité" value={review.priority} />
              <Stat label="Partenaire" value={review.partnerName ?? '—'} />
              {review.orderId && <Stat label="Commande" value={review.orderId.slice(0, 8)} />}
              {review.driverName && <Stat label="Chauffeur" value={review.driverName} />}
            </div>
            <p className="text-xs text-purple-700 bg-purple-50 p-3 rounded-xl mb-4"><strong>Recommandation :</strong> {review.recommendation}</p>
            {readOnly && <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mb-4">Module en lecture seule. Connectez le backend avant activation des actions sensibles.</p>}
            <div className="space-y-2">
              <Btn label="Répondre" disabled={readOnly} onClick={() => onReply?.('Merci pour votre retour, nous apprécions votre confiance.')} />
              <Btn label="Transférer support" disabled={readOnly} onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Support' }))} />
              <Btn label="Ouvrir enquête" disabled={readOnly} onClick={onEscalate} />
              <Btn label="Signaler" disabled={readOnly} onClick={onReport} danger />
              <Btn label="Ouvrir Order Truth" onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Commandes' }))} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="p-2 rounded-lg bg-gray-50"><p className="text-gray-500">{label}</p><p className="font-bold">{value}</p></div>;
}

function Btn({ label, danger, disabled, onClick }: { label: string; danger?: boolean; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`w-full py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50 ${danger ? 'border-red-200 text-red-700' : ''}`}>{label}</button>;
}
