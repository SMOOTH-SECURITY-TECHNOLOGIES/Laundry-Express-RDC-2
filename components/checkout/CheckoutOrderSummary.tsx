import React, { useState } from 'react';
import { Icon } from '../Icon';
import { Partner, ServiceItem } from '../../types';
import { OrderDraft } from '../../context/OrderContext';
import { calculateSubtotal } from '../../utils/order-pricing';

interface CheckoutOrderSummaryProps {
  orderDraft: OrderDraft;
  formatPrice: (price: number) => string;
  appliedPromoCode?: string;
  discountAmount?: number;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  promoStatus: { type: 'success' | 'error'; message: string } | null;
  isApplyingPromo: boolean;
}

function countArticles(serviceItems?: ServiceItem[]): number {
  if (!serviceItems) return 0;
  return serviceItems.reduce((sum, si) => {
    if (si.items) return sum + si.items.reduce((s, item) => s + item.quantity, 0);
    if (si.weight) return sum + 1;
    return sum;
  }, 0);
}

function renderServiceItemLines(
  serviceItems: ServiceItem[],
  formatPrice: (price: number) => string,
): React.ReactNode {
  return serviceItems.flatMap((si) => {
    if (si.weight && si.service) {
      return (
        <div key={si.service.id} className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            {si.service.title} ({si.weight} kg)
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatPrice((si.service.price || 0) * si.weight)}
          </span>
        </div>
      );
    }
    return (si.items ?? []).map((item) => (
      <div key={`${si.service.id}-${item.article.id}`} className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-300">
          {item.quantity}x {item.article.name}
        </span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatPrice(item.article.price * item.quantity)}
        </span>
      </div>
    ));
  });
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  orderDraft,
  formatPrice,
  appliedPromoCode,
  discountAmount,
  onApplyPromo,
  onRemovePromo,
  promoStatus,
  isApplyingPromo,
}) => {
  const [promoInput, setPromoInput] = useState('');

  const partner = orderDraft.partner;
  const serviceItems = orderDraft.serviceItems || [];
  const subtotal = calculateSubtotal(serviceItems);
  const deliveryFee = 2.0;
  const optionsFee = 0.0;
  const taxes = 0.0;
  const totalBeforeDiscount = subtotal + deliveryFee + optionsFee + taxes;
  const discount = discountAmount || 0;
  const estimatedTotal = Math.max(0, totalBeforeDiscount - discount);
  const articleCount = countArticles(serviceItems);

  const handleApply = () => {
    if (promoInput.trim()) {
      onApplyPromo(promoInput.trim());
    }
  };

  const handleRemove = () => {
    setPromoInput('');
    onRemovePromo();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Récapitulatif de commande
        </h3>

        {partner && (
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-blue to-[#00B4D8] flex items-center justify-center shrink-0 overflow-hidden">
              {partner.imageUrls && partner.imageUrls[0] ? (
                <img src={partner.imageUrls[0]} alt={partner.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">{partner.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{partner.name}</p>
              <div className="flex items-center gap-1">
                <Icon name="star" className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{partner.rating}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({partner.reviewCount} avis)</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{partner.address}</p>
              <p className="text-xs text-brand-blue font-semibold">Livraison 24h</p>
            </div>
          </div>
        )}

        {(articleCount > 0 || serviceItems.some((si) => si.weight)) && (
          <div className="py-4 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Articles ({articleCount || serviceItems.length})
            </p>
            <div className="space-y-1.5">
              {renderServiceItemLines(serviceItems, formatPrice)}
            </div>
          </div>
        )}

        <div className="py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Sous-total</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
              Livraison
              <span className="relative group">
                <Icon name="question-mark-circle" className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-32 text-center text-xs bg-gray-900 text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Frais de livraison à domicile
                </span>
              </span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Options</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(optionsFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Taxes</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(taxes)}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Total estimé</span>
            <span className="text-2xl font-bold text-brand-blue">{formatPrice(estimatedTotal)}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Prix variable selon le poids / nombre d'articles.
          </p>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-3">
          <Icon name="truck" className="w-5 h-5 text-brand-blue shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Livraison standard incluse</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aucun frais supplémentaire.</p>
          </div>
        </div>

        <div className="mt-4">
          {appliedPromoCode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Icon name="check" className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300 flex-1">
                  {appliedPromoCode}
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Retirer le code promo"
                >
                  <Icon name="xmark" className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400 font-semibold">Réduction</span>
                <span className="font-bold text-green-600 dark:text-green-400">-{formatPrice(discount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-900 dark:text-white">Nouveau total estimé</span>
                <span className="text-brand-blue">{formatPrice(estimatedTotal)}</span>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="promo-code" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Code promo
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-code"
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="WELCOME20"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplyingPromo || !promoInput.trim()}
                  className="px-4 py-2 rounded-xl border border-brand-blue text-brand-blue font-semibold text-sm hover:bg-brand-blue/5 transition-colors disabled:opacity-50"
                >
                  {isApplyingPromo ? '...' : 'Appliquer'}
                </button>
              </div>
              {promoStatus && (
                <p className={`text-xs mt-1 font-medium ${promoStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {promoStatus.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-3">
          <Icon name="clock" className="w-5 h-5 text-brand-blue shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Délai estimé : 24h</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ramassage aujourd'hui à 16h00</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-slate-700 p-5 sm:p-6">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Nos garanties</h4>
        <div className="space-y-2.5">
          {[
            { icon: 'shield-check' as const, title: 'Paiement sécurisé', desc: 'Transactions 100% protégées' },
            { icon: 'badge-check' as const, title: 'Partenaire vérifié', desc: 'Meilleurs pressings de Kinshasa' },
            { icon: 'clock' as const, title: 'Suivi en temps réel', desc: 'De la collecte à la livraison' },
            { icon: 'shield' as const, title: 'Assurance textile incluse', desc: 'Vos articles sont protégés' },
            { icon: 'lifebuoy' as const, title: 'Support 24/7', desc: 'Nous sommes toujours là' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-2.5">
              <Icon name={item.icon} className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">Besoin d'aide ?</p>
          <a href="tel:+243812345678" className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue">
            <Icon name="phone" className="w-3 h-3" />
            +243 81 234 5678
          </a>
        </div>
      </div>
    </div>
  );
};
