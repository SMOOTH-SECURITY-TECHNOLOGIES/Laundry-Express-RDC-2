import React from 'react';
import { Icon } from '../Icon';
import { User } from '../../types';

interface PickupAddressCardProps {
  user: User | null;
  onEditClick: () => void;
}

export const PickupAddressCard: React.FC<PickupAddressCardProps> = ({ user, onEditClick }) => {
  const hasAddress = user?.pickupAddress && (user.pickupAddress.avenue || user.pickupAddress.commune);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
            <Icon name="mapPin" className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Adresse de ramassage
            </p>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
              {user?.name || 'Client'}
            </h2>
            {hasAddress ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {[
                    user?.pickupAddress?.numero,
                    user?.pickupAddress?.avenue,
                    user?.pickupAddress?.quartier,
                    user?.pickupAddress?.commune,
                  ].filter(Boolean).join(', ')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Kinshasa, RDC
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {user?.phone}
                </p>
              </>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">
                Adresse à compléter
              </p>
            )}
          </div>
          {hasAddress && (
            <div className="hidden sm:block w-32 h-24 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-30">
                <svg viewBox="0 0 200 150" className="w-full h-full">
                  <line x1="20" y1="50" x2="180" y2="50" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="20" y1="80" x2="180" y2="80" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="20" y1="110" x2="180" y2="110" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="60" y1="20" x2="60" y2="140" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="100" y1="20" x2="100" y2="140" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="140" y1="20" x2="140" y2="140" stroke="#94a3b8" strokeWidth="1" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center shadow-lg">
                  <Icon name="mapPin" className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="w-2 h-2 bg-brand-blue rounded-full mx-auto mt-0.5 animate-ping" />
              </div>
            </div>
          )}
        </div>

        {!hasAddress && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-2">
              <Icon name="warning" className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Votre adresse doit être confirmée avant de continuer.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onEditClick}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-blue-700 dark:text-[#00B4D8] dark:hover:text-[#0090b0] transition-colors"
        >
          <Icon name="pencil" className="w-4 h-4" />
          Modifier l'adresse
        </button>
      </div>
    </div>
  );
};
