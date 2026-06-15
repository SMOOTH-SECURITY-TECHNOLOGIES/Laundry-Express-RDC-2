import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon';
import { PartnerCartLine } from '../../hooks/usePartnerServiceCart';
import { shopServicePriceLabel, shopLineTotal } from '../../utils/partner-catalog-mappers';
import { Service } from '../../types';

type Props = {
  open: boolean;
  partnerName: string;
  lines: PartnerCartLine[];
  subtotal: number;
  formatPrice: (price: number) => string;
  onClose: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (serviceId: string, quantity: number) => void;
  onUpdateWeight: (serviceId: string, weight: number) => void;
  onRemove: (serviceId: string) => void;
};

const turnaroundLabel = (service: Service) => {
  const hours = service.turnaroundHours;
  if (!hours) return 'Delai sur demande';
  if (hours <= 24) return `Livraison ~${hours}h`;
  return `Livraison ~${Math.round(hours / 24)} j`;
};

export const PartnerServiceCartDrawer: React.FC<Props> = ({
  open,
  partnerName,
  lines,
  subtotal,
  formatPrice,
  onClose,
  onCheckout,
  onUpdateQuantity,
  onUpdateWeight,
  onRemove,
}) => {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[210]" role="dialog" aria-modal="true" aria-label="Panier services">
      <button
        type="button"
        aria-label="Fermer le panier"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-lg font-bold text-[#03045E]">Votre panier</p>
            <p className="text-xs text-slate-500">{partnerName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Fermer">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {lines.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">Ajoutez des services depuis la boutique.</p>
          ) : lines.map((line) => (
            <div key={line.service.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex gap-3">
                <img
                  src={line.service.imageUrl}
                  alt={line.service.title}
                  className="h-16 w-16 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#0F172A] truncate">{line.service.title}</p>
                  <p className="text-xs text-slate-500">{turnaroundLabel(line.service)}</p>
                  <p className="text-sm font-bold text-brand-blue mt-1">
                    {shopServicePriceLabel(line.service, formatPrice)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(line.service.id)}
                  className="text-slate-400 hover:text-red-500 shrink-0"
                  aria-label="Retirer"
                >
                  <Icon name="xmark" className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {line.service.priceModel === 'per_kg' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateWeight(line.service.id, (line.weight || 1) - 0.5)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-14 text-center">{(line.weight || 1).toFixed(1)} kg</span>
                    <button
                      type="button"
                      onClick={() => onUpdateWeight(line.service.id, (line.weight || 1) + 0.5)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.service.id, line.quantity - 1)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-8 text-center">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.service.id, line.quantity + 1)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                )}
                <span className="text-sm font-extrabold text-[#0F172A]">
                  {formatPrice(shopLineTotal(line.service, line.quantity, line.weight))}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Sous-total</span>
            <span className="text-lg font-extrabold text-[#0F172A]">{formatPrice(subtotal)}</span>
          </div>
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={onCheckout}
            className="w-full rounded-xl bg-brand-blue py-3.5 text-sm font-bold text-white hover:bg-brand-blue-700 transition disabled:opacity-50"
          >
            Commander
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
};
