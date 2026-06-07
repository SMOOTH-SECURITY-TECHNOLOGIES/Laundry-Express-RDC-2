import { useState } from 'react';
import { AnomalyItem } from '../../../lib/admin/anomalies-types';
import AnomalyCard from './AnomalyCard';

interface AnomalyListProps {
  anomalies: AnomalyItem[];
  total: number;
  onInvestigate: (id: string) => void;
  onTicket: (id: string) => void;
  onResolve: (id: string) => void;
}

const PAGE_SIZE = 7;

export default function AnomalyList({ anomalies, total, onInvestigate, onTicket, onResolve }: AnomalyListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
            Liste des anomalies
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {total}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Affichage {start}-{end} sur {total} anomalies
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {anomalies.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Aucune anomalie détectée.</p>
        )}
        {anomalies.map((anomaly) => (
          <AnomalyCard
            key={anomaly.id}
            anomaly={anomaly}
            onInvestigate={onInvestigate}
            onTicket={onTicket}
            onResolve={onResolve}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
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
  );
}
