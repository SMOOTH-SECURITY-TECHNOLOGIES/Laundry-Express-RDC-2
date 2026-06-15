import React from 'react';
import { Icon } from '../Icon';
import { Service } from '../../types';
import { PartnerCartLine } from '../../hooks/usePartnerServiceCart';
import { shopServicePriceLabel } from '../../utils/partner-catalog-mappers';
import { PartnerServiceCartDrawer } from './PartnerServiceCartDrawer';

type Props = {
  partnerName: string;
  services: Service[];
  loading?: boolean;
  formatPrice: (price: number) => string;
  cartLines: PartnerCartLine[];
  cartOpen: boolean;
  cartSubtotal: number;
  cartItemCount: number;
  onAdd: (service: Service) => void;
  onOpenCart: () => void;
  onCloseCart: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (serviceId: string, quantity: number) => void;
  onUpdateWeight: (serviceId: string, weight: number) => void;
  onRemove: (serviceId: string) => void;
};

const turnaroundLabel = (service: Service) => {
  const hours = service.turnaroundHours;
  if (!hours) return 'Delai a confirmer';
  if (hours <= 24) return `${hours}h`;
  return `${Math.round(hours / 24)} j`;
};

export const PartnerServiceShopSection: React.FC<Props> = ({
  partnerName,
  services,
  loading,
  formatPrice,
  cartLines,
  cartOpen,
  cartSubtotal,
  cartItemCount,
  onAdd,
  onOpenCart,
  onCloseCart,
  onCheckout,
  onUpdateQuantity,
  onUpdateWeight,
  onRemove,
}) => (
  <>
    <section className="bg-white rounded-2xl border border-slate-100 p-6" data-testid="partner-service-shop">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 rounded-lg text-brand-blue">
            <Icon name="shoppingBag" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#03045E]">Notre boutique</h2>
            <p className="text-xs text-slate-500">Services et tarifs de {partnerName}</p>
          </div>
        </div>
        {cartItemCount > 0 && (
          <button
            type="button"
            onClick={onOpenCart}
            className="relative rounded-xl border border-brand-blue/20 bg-blue-50 px-3 py-2 text-xs font-bold text-brand-blue hover:bg-blue-100 transition"
          >
            Panier ({cartItemCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
          Aucun service disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex gap-3 rounded-xl border border-slate-100 p-3 hover:border-brand-blue/30 hover:shadow-sm transition"
            >
              <img
                src={service.imageUrl}
                alt={service.title}
                className="h-20 w-20 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1 flex flex-col">
                <p className="text-sm font-bold text-[#0F172A] line-clamp-2">{service.title}</p>
                {service.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{service.description}</p>
                )}
                <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-brand-blue">
                      {shopServicePriceLabel(service, formatPrice)}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Icon name="clock" className="w-3 h-3" />
                      {turnaroundLabel(service)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(service)}
                    className="shrink-0 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-blue-700 transition"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>

    {cartItemCount > 0 && !cartOpen && (
      <button
        type="button"
        onClick={onOpenCart}
        className="fixed bottom-24 right-4 z-[120] flex items-center gap-2 rounded-full bg-brand-blue px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/30 hover:bg-brand-blue-700 transition lg:bottom-8"
      >
        <Icon name="shoppingBag" className="w-4 h-4" />
        Panier · {formatPrice(cartSubtotal)}
      </button>
    )}

    <PartnerServiceCartDrawer
      open={cartOpen}
      partnerName={partnerName}
      lines={cartLines}
      subtotal={cartSubtotal}
      formatPrice={formatPrice}
      onClose={onCloseCart}
      onCheckout={onCheckout}
      onUpdateQuantity={onUpdateQuantity}
      onUpdateWeight={onUpdateWeight}
      onRemove={onRemove}
    />
  </>
);
