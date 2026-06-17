import React from 'react';
import { Icon } from '../Icon';
import type { LogisticsStatus } from './logistics-types';

interface MobileMissionCardProps {
  missionId: string;
  status: LogisticsStatus;
  statusLabel: string;
  customerName: string;
  pickupLabel: string;
  deliveryLabel: string;
  etaLabel?: string;
  distanceLabel?: string;
  driverName?: string;
  vehiclePlate?: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onCallDriver?: () => void;
  onCallCustomer?: () => void;
  onProof?: () => void;
  onIncident?: () => void;
  onOpenDetails?: () => void;
}

const statusTone: Record<LogisticsStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  delayed: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-700',
};

export const MobileMissionCard: React.FC<MobileMissionCardProps> = ({
  missionId,
  status,
  statusLabel,
  customerName,
  pickupLabel,
  deliveryLabel,
  etaLabel,
  distanceLabel,
  driverName,
  vehiclePlate,
  primaryActionLabel,
  onPrimaryAction,
  onCallDriver,
  onCallCustomer,
  onProof,
  onIncident,
  onOpenDetails,
}) => {
  const secondaryActions = [
    onCallDriver ? { label: 'Appeler', icon: 'phone' as const, action: onCallDriver, tone: 'border-green-200 text-green-700' } : null,
    onCallCustomer ? { label: 'Client', icon: 'user' as const, action: onCallCustomer, tone: 'border-blue-200 text-brand-blue' } : null,
    onProof ? { label: 'Preuve', icon: 'camera' as const, action: onProof, tone: 'border-violet-200 text-violet-700' } : null,
    onIncident ? { label: 'Incident', icon: 'warning' as const, action: onIncident, tone: 'border-red-200 text-red-600' } : null,
  ].filter(Boolean) as Array<{ label: string; icon: React.ComponentProps<typeof Icon>['name']; action: () => void; tone: string }>;

  return (
    <article className="rounded-[28px] border border-surface-border-subtle bg-surface-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-content-muted">Mission active</p>
          <h3 className="mt-1 truncate text-2xl font-black text-content-primary">{missionId}</h3>
          <p className="mt-1 truncate text-sm font-bold text-content-muted">{customerName}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusTone[status]}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-surface-muted p-3">
          <div className="flex gap-3">
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <Icon name="mapPin" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-content-muted">Pickup</p>
              <p className="truncate text-sm font-black text-content-primary">{pickupLabel}</p>
            </div>
          </div>
          <div className="my-2 ml-4 h-5 border-l-2 border-dashed border-surface-border-subtle" />
          <div className="flex gap-3">
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Icon name="check" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-content-muted">Destination</p>
              <p className="truncate text-sm font-black text-content-primary">{deliveryLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface-muted p-3">
            <p className="text-xs font-bold text-content-muted">ETA</p>
            <p className="mt-1 text-lg font-black text-content-primary">{etaLabel || '--'}</p>
          </div>
          <div className="rounded-2xl bg-surface-muted p-3">
            <p className="text-xs font-bold text-content-muted">Distance</p>
            <p className="mt-1 text-lg font-black text-content-primary">{distanceLabel || '--'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-surface-muted p-3">
            <p className="text-xs font-bold text-content-muted">Chauffeur</p>
            <p className="mt-1 truncate font-black text-content-primary">{driverName || 'A assigner'}</p>
          </div>
          <div className="rounded-2xl bg-surface-muted p-3">
            <p className="text-xs font-bold text-content-muted">Vehicule</p>
            <p className="mt-1 truncate font-black text-content-primary">{vehiclePlate || 'A confirmer'}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 text-sm font-black text-white hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
        >
          <Icon name="play" className="h-4 w-4" />
          {primaryActionLabel}
        </button>
        <div className="grid grid-cols-2 gap-2">
          {secondaryActions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className={`flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black ${item.tone} hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2`}
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="min-h-[46px] rounded-2xl bg-surface-muted px-3 text-xs font-black text-content-primary hover:bg-surface-page focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            Ouvrir le detail trajet
          </button>
        )}
      </div>
    </article>
  );
};

export default MobileMissionCard;
