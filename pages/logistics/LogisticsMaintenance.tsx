import React from 'react';
import { Icon } from '../../components/Icon';
import type { MaintenanceEvent } from '../../components/logistics/logistics-types';
import { logisticsCard } from './logistics-ui';

const maintenanceEvents: MaintenanceEvent[] = [
  {
    id: 'mnt-001',
    vehicleId: 'veh-003',
    title: 'Contrôle freinage moto',
    status: 'scheduled',
    dueDate: '2026-06-18',
    costEstimate: 45,
  },
  {
    id: 'mnt-002',
    vehicleId: 'veh-002',
    title: 'Vidange van livraison',
    status: 'in_progress',
    dueDate: '2026-06-16',
    costEstimate: 120,
  },
  {
    id: 'mnt-003',
    vehicleId: 'veh-001',
    title: 'Inspection pneus',
    status: 'overdue',
    dueDate: '2026-06-14',
    costEstimate: 35,
  },
];

export const LogisticsMaintenance: React.FC = () => (
  <section className={`${logisticsCard} p-5`}>
    <div className="flex items-center gap-2">
      <Icon name="settings" className="h-5 w-5 text-brand-blue" />
      <h2 className="text-lg font-black text-content-primary">Maintenance</h2>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-3">
      {maintenanceEvents.map((event) => (
        <article key={event.id} className="rounded-xl border border-surface-border-subtle bg-surface-muted p-4">
          <p className="text-sm font-black text-content-primary">{event.title}</p>
          <p className="mt-1 text-xs text-content-muted">{event.vehicleId}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-content-muted">Statut</dt>
              <dd className="font-bold text-content-primary">{event.status}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-content-muted">Échéance</dt>
              <dd className="font-bold text-content-primary">{event.dueDate}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-content-muted">Estimation</dt>
              <dd className="font-bold text-content-primary">{event.costEstimate} $</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  </section>
);
