import React from 'react';
import { Icon } from '../Icon';

interface ConfirmOrderCardProps {
  total: string;
  isLoading: boolean;
  onConfirm: () => void;
}

export const ConfirmOrderCard: React.FC<ConfirmOrderCardProps> = ({ total, isLoading, onConfirm }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="hidden sm:flex w-14 h-14 rounded-full bg-brand-blue/10 items-center justify-center shrink-0">
          <Icon name="shield-check" className="w-7 h-7 text-brand-blue" />
        </div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Prêt à confirmer votre commande ?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Vérifiez vos informations et confirmez votre commande en toute sérénité.
          </p>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Icon name="shield-check" className="w-4 h-4" />
              Confirmer et payer {total}
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center sm:text-left">
        En confirmant, vous acceptez nos{' '}
        <a href="/terms" className="text-brand-blue hover:underline font-semibold">
          Conditions Générales
        </a>.
      </p>
    </div>
  );
};
