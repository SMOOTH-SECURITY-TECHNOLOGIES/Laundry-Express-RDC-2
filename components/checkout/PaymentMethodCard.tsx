import React, { useState } from 'react';
import { Icon } from '../Icon';

interface PaymentMethodCardProps {
  selectedMethod: 'cash' | 'mobile_money' | 'card';
  onMethodChange: (method: 'cash' | 'mobile_money' | 'card') => void;
  mobileMoneyDetails: { operator: string; phone: string };
  onMobileMoneyDetailsChange: (details: { operator: string; phone: string }) => void;
  cardDetails: { number: string; expiry: string; cvv: string };
  onCardDetailsChange: (details: { number: string; expiry: string; cvv: string }) => void;
}

const methods = [
  { id: 'cash' as const, label: 'Cash', desc: 'Paiement à la livraison', icon: 'currencyDollar' as const },
  { id: 'mobile_money' as const, label: 'Mobile Money', desc: 'M-Pesa / Airtel / Orange Money', icon: 'phone' as const },
  { id: 'card' as const, label: 'Carte bancaire', desc: 'Visa / Mastercard', icon: 'credit-card' as const },
];

const operators = [
  { id: 'M-Pesa', label: 'M-Pesa' },
  { id: 'Airtel Money', label: 'Airtel Money' },
  { id: 'Orange Money', label: 'Orange Money' },
  { id: 'Afrimoney', label: 'Afrimoney' },
];

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return digits.slice(0, 2) + '/' + digits.slice(2);
  }
  return digits;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  selectedMethod,
  onMethodChange,
  mobileMoneyDetails,
  onMobileMoneyDetailsChange,
  cardDetails,
  onCardDetailsChange,
}) => {
  const [mmPhoneError, setMmPhoneError] = useState('');

  const handleMmPhoneChange = (phone: string) => {
    const formatted = phone.replace(/[^\d+]/g, '');
    if (formatted.length <= 13) {
      onMobileMoneyDetailsChange({ ...mobileMoneyDetails, phone: formatted });
      if (formatted.length > 0 && !/^\+?243\d{0,9}$/.test(formatted)) {
        setMmPhoneError('Format RDC : +243 XXX XXX XXX');
      } else {
        setMmPhoneError('');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
          <Icon name="currencyDollar" className="w-5 h-5 text-brand-blue" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          Mode de paiement
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onMethodChange(method.id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Payer par ${method.label}`}
              className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'border-brand-blue bg-brand-blue/5 ring-2 ring-brand-blue/20'
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-brand-blue/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-brand-blue rounded-full flex items-center justify-center">
                  <Icon name="check" className="w-3 h-3 text-white" />
                </div>
              )}
              <Icon name={method.icon} className="w-5 h-5 text-brand-blue mb-2" />
              <p className="font-bold text-gray-900 dark:text-white text-sm">{method.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{method.desc}</p>
            </button>
          );
        })}
      </div>

      {selectedMethod === 'cash' && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <Icon name="currencyDollar" className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Vous paierez au chauffeur lors de la livraison.
          </p>
        </div>
      )}

      {selectedMethod === 'mobile_money' && (
        <div className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div>
            <label htmlFor="mm-operator" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Opérateur
            </label>
            <select
              id="mm-operator"
              value={mobileMoneyDetails.operator}
              onChange={(e) => onMobileMoneyDetailsChange({ ...mobileMoneyDetails, operator: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            >
              {operators.map((op) => (
                <option key={op.id} value={op.id}>{op.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mm-phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Numéro de téléphone
            </label>
            <input
              id="mm-phone"
              type="tel"
              value={mobileMoneyDetails.phone}
              onChange={(e) => handleMmPhoneChange(e.target.value)}
              placeholder="+243 XXX XXX XXX"
              className={`w-full px-4 py-2.5 rounded-xl border ${mmPhoneError ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue`}
            />
            {mmPhoneError && <p className="text-xs text-red-500 mt-1">{mmPhoneError}</p>}
          </div>
        </div>
      )}

      {selectedMethod === 'card' && (
        <div className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div>
            <label htmlFor="card-number" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Numéro de carte
            </label>
            <input
              id="card-number"
              type="text"
              value={cardDetails.number}
              onChange={(e) => onCardDetailsChange({ ...cardDetails, number: formatCardNumber(e.target.value) })}
              placeholder="XXXX XXXX XXXX XXXX"
              maxLength={19}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="card-expiry" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Expiration
              </label>
              <input
                id="card-expiry"
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => onCardDetailsChange({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                placeholder="MM/AA"
                maxLength={5}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
            <div>
              <label htmlFor="card-cvv" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                CVV
              </label>
              <input
                id="card-cvv"
                type="password"
                value={cardDetails.cvv}
                onChange={(e) => onCardDetailsChange({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="***"
                maxLength={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 p-2">
            <Icon name="shield-check" className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paiement sécurisé via prestataire certifié.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
