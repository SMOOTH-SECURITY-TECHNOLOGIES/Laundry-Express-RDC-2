import React from 'react';
import { Icon } from '../Icon';

interface DriverInstructionsCardProps {
  value: string;
  onChange: (value: string) => void;
}

export const DriverInstructionsCard: React.FC<DriverInstructionsCardProps> = ({ value, onChange }) => {
  const maxLength = 200;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
          <Icon name="pencil" className="w-5 h-5 text-brand-blue" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Instructions pour le chauffeur
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">(optionnel)</p>
        </div>
      </div>

      <div className="relative">
        <textarea
          id="driver-instructions"
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              onChange(e.target.value);
            }
          }}
          rows={4}
          placeholder="Portail noir, Appartement 2ème étage, Appeler avant arrivée..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors resize-none"
          aria-label="Instructions pour le chauffeur"
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
          {value.length} / {maxLength}
        </div>
      </div>
    </div>
  );
};
