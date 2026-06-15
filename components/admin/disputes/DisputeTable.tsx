import { useState } from 'react';
import type { DisputeRequest } from '../../../lib/admin/disputes-types';
import { getStatusLabel, getTypeLabel, getStatusBadgeColor, getTypeBadgeColor, formatCurrency, formatDateTime } from '../../../lib/admin/disputes-formatters';
import { Icon } from '../../Icon';

interface DisputeTableProps {
  requests: DisputeRequest[];
  totalCount?: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
  onInvestigate?: (id: string) => void;
  onOrderTruth?: (orderId: string) => void;
  readOnly?: boolean;
}

const PAGE_SIZE = 10;

export function DisputeTable({
  requests,
  totalCount,
  onApprove,
  onReject,
  onView,
  onInvestigate,
  onOrderTruth,
  readOnly,
}: DisputeTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const total = requests.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const visibleRequests = requests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
            Demandes de remboursement
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {total}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Affichage {start}–{end} sur {total}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID demande</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commande</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Partenaire</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date demande</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visibleRequests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-gray-700">{req.id}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-700">{req.orderId}</td>
                <td className="px-5 py-3 text-gray-900 font-medium">{req.clientName}</td>
                <td className="px-5 py-3 text-gray-700">{req.partnerName}</td>
                <td className="px-5 py-3 text-gray-900 font-semibold">
                  {formatCurrency(req.amount, req.currency)}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeBadgeColor(req.type)}`}>
                    {getTypeLabel(req.type)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(req.requestedAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(req.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Voir"
                    >
                      <Icon name="search" className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === req.id ? null : req.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Icon name="bars3" className="w-4 h-4" />
                      </button>
                      {openMenu === req.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-lg z-10 py-1">
                          <button
                            onClick={() => { onView(req.id); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon name="search" className="w-4 h-4 text-gray-400" /> Voir détails
                          </button>
                          {!readOnly && req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { onApprove(req.id); setOpenMenu(null); }}
                                className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                              >
                                <Icon name="check" className="w-4 h-4 text-green-500" /> Approuver
                              </button>
                              <button
                                onClick={() => { onReject(req.id); setOpenMenu(null); }}
                                className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Icon name="xmark" className="w-4 h-4 text-red-500" /> Rejeter
                              </button>
                            </>
                          )}
                          {onInvestigate && (
                            <button
                              onClick={() => { onInvestigate(req.id); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                            >
                              <Icon name="shield-check" className="w-4 h-4 text-orange-500" /> Investiguer
                            </button>
                          )}
                          {onOrderTruth && (
                            <button
                              onClick={() => { onOrderTruth(req.orderId); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                            >
                              <Icon name="sparkles" className="w-4 h-4 text-indigo-500" /> Order Truth
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
        <button
          type="button"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Voir toutes les demandes ({totalCount ?? total}) →
        </button>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Précédent
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                page === currentPage
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
