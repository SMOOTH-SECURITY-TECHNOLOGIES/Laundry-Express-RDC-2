import React from 'react';
import { Icon } from '../Icon';

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = [
  { label: 'Service', detail: 'Nettoyage à sec' },
  { label: 'Partenaire', detail: 'Prestige Pressing' },
  { label: 'Articles', detail: 'Vos articles' },
  { label: 'Adresse & paiement', detail: 'Règlement' },
  { label: 'Confirmation', detail: 'Commande reçue' },
];

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  return (
    <div className="flex items-start justify-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2">
      {steps.map((item, index) => {
        const isCompleted = currentStep > index;
        const isCurrent = currentStep === index;
        return (
          <React.Fragment key={item.label}>
            {index > 0 && (
              <div
                className={`hidden sm:block h-0.5 w-8 lg:w-16 mt-4 transition-colors duration-300 ${
                  isCompleted ? 'bg-brand-blue' : 'bg-gray-200 dark:bg-slate-700'
                }`}
              />
            )}
            <div className="flex min-w-[80px] sm:min-w-[100px] items-start gap-1.5 sm:gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-brand-blue text-white'
                    : isCurrent
                    ? 'bg-brand-blue text-white ring-4 ring-brand-blue/20'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Icon name="check" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="hidden sm:block min-w-0">
                <p
                  className={`text-xs sm:text-sm font-semibold leading-tight ${
                    isCurrent
                      ? 'text-brand-blue'
                      : isCompleted
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                  {item.detail}
                </p>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
