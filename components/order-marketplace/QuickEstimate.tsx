import React from 'react';
import { Icon } from '../Icon';

export interface EstimateItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

interface QuickEstimateProps {
  items: EstimateItem[];
  total: number;
  formatPrice: (price: number) => string;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onContinue: () => void;
}

export const QuickEstimate: React.FC<QuickEstimateProps> = ({
  items,
  total,
  formatPrice,
  onIncrement,
  onDecrement,
  onContinue,
}) => (
  <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6" aria-labelledby="quick-estimate-title">
    <div className="text-center mb-5">
      <h2 id="quick-estimate-title" className="text-2xl font-bold text-gray-900 dark:text-white">Estimation Rapide</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajoutez vos articles pour estimer le cout de votre commande</p>
    </div>

    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_120px_90px] items-center gap-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 p-3">
          <div className="flex items-center gap-3 min-w-0">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover bg-white dark:bg-slate-700 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                <Icon name="shirt" className="w-6 h-6 text-brand-blue" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(item.price)} / article</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onDecrement(item.id)}
              disabled={item.quantity === 0}
              aria-label={`Diminuer ${item.name}`}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-brand-blue flex items-center justify-center hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="minus" className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-gray-900 dark:text-white" aria-label={`${item.quantity} ${item.name}`}>
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(item.id)}
              aria-label={`Augmenter ${item.name}`}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-brand-blue flex items-center justify-center hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <Icon name="plus" className="w-4 h-4" />
            </button>
          </div>

          <p className="text-right text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
        </div>
      ))}
    </div>

    <div className="mt-5 rounded-xl bg-brand-blue/10 p-4 flex items-center justify-between">
      <span className="font-bold text-gray-900 dark:text-white">Total estime</span>
      <span className="text-2xl font-bold text-brand-blue" data-testid="estimate-total">{formatPrice(total)}</span>
    </div>

    <button
      type="button"
      onClick={onContinue}
      disabled={total <= 0}
      className="mt-4 w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-bold py-3.5 px-5 rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Continuer la commande
      <Icon name="arrowRight" className="w-4 h-4" />
    </button>
  </section>
);
