import React from 'react';
import { Icon } from '../../components/Icon';
import type { Vehicle } from '../../components/logistics/logistics-types';
import { logisticsCard } from './logistics-ui';

const vehicles: Vehicle[] = [
  {
    id: 'veh-001',
    plate: 'KIN-042-MT',
    type: 'moto',
    status: 'in_transit',
    driverId: 'drv-001',
    zone: 'Gombe',
    lastKnownLocation: 'Av. Tombalbaye',
  },
  {
    id: 'veh-002',
    plate: 'KIN-118-VN',
    type: 'van',
    status: 'assigned',
    driverId: 'drv-002',
    zone: 'Limete',
    lastKnownLocation: 'Boulevard Lumumba',
  },
  {
    id: 'veh-003',
    plate: 'KIN-207-MT',
    type: 'moto',
    status: 'delayed',
    driverId: 'drv-003',
    zone: 'Ngaliema',
    lastKnownLocation: 'Route de Matadi',
  },
];

const statusLabel: Record<Vehicle['status'], string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'En route',
  delivered: 'Livré',
  delayed: 'Retard',
  failed: 'Échec',
  cancelled: 'Annulé',
};

export const LogisticsFleet: React.FC = () => (
  <div className="space-y-6">
    <section className={`${logisticsCard} p-5`}>
      <div className="flex items-center gap-2">
        <Icon name="truck" className="h-5 w-5 text-brand-blue" />
        <h2 className="text-lg font-black text-content-primary">Fleet Management</h2>
      </div>
      <p className="mt-1 text-sm text-content-muted">Véhicules rattachés aux opérations Laundry Express.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="rounded-xl border border-surface-border-subtle bg-surface-muted p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-content-primary">{vehicle.plate}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-content-muted">{vehicle.type}</p>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-2 py-1 text-[11px] font-bold text-brand-blue">
                {statusLabel[vehicle.status]}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Zone</dt>
                <dd className="font-bold text-content-primary">{vehicle.zone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Chauffeur</dt>
                <dd className="font-bold text-content-primary">{vehicle.driverId}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Position</dt>
                <dd className="text-right font-bold text-content-primary">{vehicle.lastKnownLocation}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  </div>
);
