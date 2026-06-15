import { Icon } from '../../Icon';
import type { ReviewItem } from '../../../lib/admin/reviews-types';

function Stars({ n }: { n: number }) {
  return <span className="text-amber-500">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

const STAT: Record<string, string> = { Public: 'bg-green-100 text-green-700', 'En attente': 'bg-yellow-100 text-yellow-700', Signalé: 'bg-red-100 text-red-700', Enquête: 'bg-orange-100 text-orange-700', Résolu: 'bg-gray-100' };

export function ReviewsTable({ reviews, onView }: { reviews: ReviewItem[]; onView: (r: ReviewItem) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b"><h3 className="text-sm font-semibold">Derniers avis ({reviews.length})</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Client</th><th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Note</th><th className="text-left px-4 py-3">Commentaire</th>
              <th className="text-left px-4 py-3">Source</th><th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Statut</th><th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50/50">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">{r.clientName.slice(0, 2)}</span>{r.clientName}</div></td>
                <td className="px-4 py-3">{r.reviewTypeLabel}</td>
                <td className="px-4 py-3"><Stars n={r.rating} /></td>
                <td className="px-4 py-3 max-w-xs truncate">{r.comment}</td>
                <td className="px-4 py-3">{r.source}</td>
                <td className="px-4 py-3 text-gray-500">{r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] ${STAT[r.statusLabel] ?? 'bg-gray-100'}`}>{r.statusLabel}</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <button type="button" onClick={() => onView(r)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Voir"><Icon name="search" className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-gray-100" title="Répondre"><Icon name="chatBubble" className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-gray-100" title="Signaler"><Icon name="warning" className="w-3.5 h-3.5" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
