import React from 'react';
import type { FinancialImpact } from '../../../lib/admin/investigate-types';

interface FinancialImpactCardProps {
  financial: FinancialImpact;
}

const fmt = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

export const FinancialImpactCard: React.FC<FinancialImpactCardProps> = ({ financial }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        IMPACT FINANCIER
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <span className="text-sm text-gray-600">Client payé</span>
          <span className="text-sm font-bold text-gray-900">{fmt(financial.clientPaid)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <span className="text-sm text-gray-600">Montant partenaire</span>
          <span className="text-sm font-bold text-gray-900">{fmt(financial.partnerAmount)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <span className="text-sm text-gray-600">Montant chauffeur</span>
          <span className="text-sm font-bold text-gray-900">{fmt(financial.driverAmount)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <span className="text-sm text-gray-600">Commission plateforme</span>
          <span className="text-sm font-bold text-gray-900">{fmt(financial.platformCommission)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
          <span className="text-sm font-medium text-red-700">Perte estimée</span>
          <span className="text-sm font-bold text-red-600">{fmt(financial.estimatedLoss)}</span>
        </div>
      </div>
    </div>
  );
};
