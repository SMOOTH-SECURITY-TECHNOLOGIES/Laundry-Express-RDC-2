import type { ClaimItem } from '../../../lib/admin/claims-types';
import { Icon } from '../../Icon';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-600',
};

export function ClaimsTable({ claims, onView }: { claims: ClaimItem[]; onView: (c: ClaimItem) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b"><h2 className="text-sm font-bold uppercase">Toutes les réclamations</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">Claim ID</th>
              <th className="text-left px-4 py-3">Sujet</th>
              <th className="text-left px-4 py-3">Résumé IA</th>
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3">Catégorie</th>
              <th className="text-left px-4 py-3">Priorité</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Impact</th>
              <th className="text-left px-4 py-3">SLA</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">#{c.claimNumber}</td>
                <td className="px-4 py-3 font-medium max-w-[160px] truncate">{c.title}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{c.aiSummary}</td>
                <td className="px-4 py-3">{c.clientName}</td>
                <td className="px-4 py-3">{c.categoryLabel}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[c.priority] ?? ''}`}>{c.priorityLabel}</span></td>
                <td className="px-4 py-3">{c.statusLabel}</td>
                <td className="px-4 py-3">${c.financialImpact.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-xs">{c.slaLabel}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => onView(c)} className="p-1.5 rounded-lg hover:bg-gray-100"><Icon name="document-text" className="w-4 h-4 text-gray-500" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
