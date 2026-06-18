import React, { useState } from 'react';
import { Icon } from './Icon';

interface ChurnCoupon {
  couponCode: string;
  discount: number;
  message: string;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
}

const urgencyColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

interface Props {
  customerId: string;
  customerName: string;
  orderCount: number;
  lastOrderDays: number;
  onCouponGenerated?: (coupon: ChurnCoupon) => void;
}

export const ChurnPredictionCoupon: React.FC<Props> = ({ customerId, customerName, orderCount, lastOrderDays, onCouponGenerated }) => {
  const [coupon, setCoupon] = useState<ChurnCoupon | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { apiGenerateChurnCoupon } = await import('../constants');
      const res = await apiGenerateChurnCoupon(customerId, orderCount, lastOrderDays);
      setCoupon(res);
      onCouponGenerated?.(res);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-surface-border-subtle bg-surface-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
          <Icon name="warning" className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-black">{customerName}</p>
          <p className="text-xs text-content-muted">{orderCount} commandes · {lastOrderDays} jours d'inactivite</p>
        </div>
      </div>

      {!coupon && (
        <button onClick={generate} disabled={loading} className="mt-3 w-full rounded-xl bg-[#005bd8] py-2.5 text-xs font-black text-white disabled:opacity-50">
          {loading ? 'Generation...' : 'Generer coupon anti-churn'}
        </button>
      )}

      {coupon && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-2.5">
            <div>
              <p className="text-xs font-bold text-content-muted">Code promo genere</p>
              <p className="font-black text-[#005bd8]">{coupon.couponCode}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${urgencyColors[coupon.urgency]}`}>
              -{coupon.discount}%
            </span>
          </div>
          <div className="rounded-xl bg-surface-muted px-4 py-2.5">
            <p className="text-xs text-content-muted">{coupon.message}</p>
          </div>
          <p className="text-[10px] text-content-muted">{coupon.reason}</p>
        </div>
      )}
    </div>
  );
};
