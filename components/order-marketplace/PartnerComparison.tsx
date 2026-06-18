import React, { useMemo, useState } from 'react';
import { Icon } from '../Icon';
import { Partner } from '../../types';

interface PartnerComparisonProps {
  partners: Partner[];
  onChoosePartner?: (partnerId: string) => void;
}

const priceLevel = (index: number) => ['$$', '$', '$$$', '$$'][index % 4];
const deliveryDelay = (index: number) => ['24h', '48h', '12-24h', '24-48h'][index % 4];

export const PartnerComparison: React.FC<PartnerComparisonProps> = ({ partners, onChoosePartner }) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const rows = partners.slice(0, 4);
  const selectedPartner = useMemo(
    () => rows.find((partner) => partner.id === selectedPartnerId) || null,
    [rows, selectedPartnerId]
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden" aria-labelledby="partner-comparison-title">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_180px]">
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-slate-700">
          <h2 id="partner-comparison-title" className="text-lg font-bold text-gray-900 dark:text-white">Comparez nos partenaires</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choisissez celui qui vous convient</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
                <th className="px-5 py-3">Partenaire</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3">Prix moyen</th>
                <th className="px-5 py-3">Delai moyen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((partner, index) => (
                <tr key={partner.id} className="border-b last:border-b-0 border-gray-100 dark:border-slate-700">
                  <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">{partner.name}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-200">
                    <Icon name="star" className="inline w-4 h-4 text-yellow-400 mr-1" />
                    {partner.rating.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-200">{priceLevel(index)}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-200">{deliveryDelay(index)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 flex items-center">
          <button
            type="button"
            onClick={() => setSelectedPartnerId(rows[0].id)}
            className="w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          >
            Comparer
            <Icon name="arrowRight" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedPartner && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPartnerId(null)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-700 p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="partner-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPartner.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedPartner.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartnerId(null)}
                aria-label="Fermer le comparateur"
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <Icon name="xmark" className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                ['Services', selectedPartner.serviceIds?.length ? `${selectedPartner.serviceIds.length} services` : 'Catalogue disponible'],
                ['Prix', priceLevel(rows.findIndex((partner) => partner.id === selectedPartner.id))],
                ['Delais', deliveryDelay(rows.findIndex((partner) => partner.id === selectedPartner.id))],
                ['Zones', selectedPartner.address || 'Kinshasa'],
                ['Avis', `${selectedPartner.reviewCount} avis`],
                ['Note', `${selectedPartner.rating.toFixed(1)} / 5`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{label}</p>
                  <p className="font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                </div>
              ))}
            </div>

            {onChoosePartner && (
              <button
                type="button"
                onClick={() => onChoosePartner(selectedPartner.id)}
                className="mt-6 w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-colors"
              >
                Choisir ce partenaire
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
