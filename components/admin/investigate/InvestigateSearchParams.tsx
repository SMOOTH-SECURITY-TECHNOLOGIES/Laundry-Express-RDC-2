import React from 'react';
import { InvestigateParams } from '../../../lib/admin/investigate-types';
import { Icon } from '../../Icon';

interface InvestigateSearchParamsProps {
  params: InvestigateParams;
  onChange: (params: InvestigateParams) => void;
  onInvestigate: () => void;
  loading: boolean;
}

const fields: { key: keyof InvestigateParams; label: string; placeholder: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'orderId', label: 'Order ID', placeholder: 'UUID de la commande', icon: 'shoppingBag' },
  { key: 'paymentId', label: 'Payment Intent ID', placeholder: 'ID du paiement', icon: 'currencyDollar' },
  { key: 'deliveryTaskId', label: 'Delivery Task ID', placeholder: 'ID de la tâche logistique', icon: 'truck' },
  { key: 'driverId', label: 'Driver ID', placeholder: 'ID chauffeur', icon: 'truck' },
  { key: 'customerPhone', label: 'Customer Phone', placeholder: 'Téléphone client', icon: 'phone' },
  { key: 'partnerId', label: 'Partner ID', placeholder: 'ID partenaire', icon: 'building' },
];

export const InvestigateSearchParams: React.FC<InvestigateSearchParamsProps> = ({
  params,
  onChange,
  onInvestigate,
  loading,
}) => {
  const handleChange = (key: keyof InvestigateParams, value: string) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        Paramètres d'investigation
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name={field.icon} className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={params[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-400">
          Au moins un ID requis. Plus les identifiants sont fournis, plus la reconstruction est précise.
        </p>
        <button
          onClick={onInvestigate}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Investigation...
            </>
          ) : (
            <>
              <Icon name="magnifying-glass-plus" className="h-4 w-4" />
              Investiguer
            </>
          )}
        </button>
      </div>
    </div>
  );
};
