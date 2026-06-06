import React from 'react';
import { Icon } from '../Icon';

export const SecurePaymentCard: React.FC = () => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
          <Icon name="shield-check" className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-green-800 dark:text-green-300">
            Paiement 100% sécurisé
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Vos données sont protégées et cryptées.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {['M-Pesa', 'Airtel', 'VISA', 'MC'].map((logo) => (
            <span
              key={logo}
              className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-gray-200 dark:border-slate-600"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
