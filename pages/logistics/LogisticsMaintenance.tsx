import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { MaintenanceEvent } from '../../components/logistics/logistics-types';
import { getMaintenanceEvents, type DataMode } from '../../services/logistics-api';
import { logisticsCard } from './logistics-ui';

const maintenanceEvents: MaintenanceEvent[] = [
  {
    id: 'mnt-001',
    vehicleId: 'veh-003',
    vehiclePlate: 'KIN-207-MT',
    title: 'Contrôle freinage moto',
    type: 'repair',
    status: 'in_progress',
    dueDate: '2026-06-18',
    cost: 45,
    nextControlAt: '2026-07-18',
    alert: 'vehicle_broken',
    vehicleAvailable: false,
  },
  {
    id: 'mnt-002',
    vehicleId: 'veh-002',
    vehiclePlate: 'KIN-118-VN',
    title: 'Vidange van livraison',
    type: 'preventive',
    status: 'scheduled',
    dueDate: '2026-06-20',
    cost: 120,
    nextControlAt: '2026-09-20',
    vehicleAvailable: true,
  },
  {
    id: 'mnt-003',
    vehicleId: 'veh-001',
    vehiclePlate: 'KIN-042-MT',
    title: 'Inspection pneus',
    type: 'inspection',
    status: 'overdue',
    dueDate: '2026-06-14',
    cost: 35,
    nextControlAt: '2026-07-14',
    alert: 'maintenance_overdue',
    vehicleAvailable: false,
  },
  {
    id: 'mnt-004',
    vehicleId: 'veh-004',
    vehiclePlate: 'KIN-301-CR',
    title: 'Renouvellement assurance',
    type: 'insurance',
    status: 'overdue',
    dueDate: '2026-06-01',
    cost: 210,
    nextControlAt: '2026-12-01',
    alert: 'insurance_expired',
    vehicleAvailable: false,
  },
];

const typeLabel: Record<MaintenanceEvent['type'], string> = {
  insurance: 'Assurance',
  repair: 'Réparation',
  preventive: 'Préventif',
  inspection: 'Inspection',
};

const statusLabel: Record<MaintenanceEvent['status'], string> = {
  scheduled: 'Planifié',
  in_progress: 'En cours',
  done: 'Terminé',
  overdue: 'Overdue',
};

const alertLabel: Record<NonNullable<MaintenanceEvent['alert']>, string> = {
  insurance_expired: 'Assurance expirée',
  vehicle_broken: 'Véhicule en panne',
  maintenance_overdue: 'Maintenance overdue',
};

const statusStyle: Record<MaintenanceEvent['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export const LogisticsMaintenance: React.FC = () => {
  const [events, setEvents] = useState<MaintenanceEvent[]>(maintenanceEvents);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  useEffect(() => {
    let mounted = true;
    getMaintenanceEvents(maintenanceEvents).then((result) => {
      if (!mounted) return;
      setEvents(result.data);
      setDataMode(result.mode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const alerts = events.filter((event) => event.alert);
  const unavailableVehicles = events.filter((event) => !event.vehicleAvailable).length;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        dataMode === 'backend'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }`}>
        {dataMode === 'backend' ? 'Données maintenance connectées au backend' : 'Mode dégradé — données maintenance locales'}
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className={`${logisticsCard} p-4`}>
          <p className="text-xs font-bold uppercase text-content-muted">Entretiens suivis</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{events.length}</p>
        </article>
        <article className={`${logisticsCard} p-4`}>
          <p className="text-xs font-bold uppercase text-content-muted">Alertes maintenance</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{alerts.length}</p>
        </article>
        <article className={`${logisticsCard} p-4`}>
          <p className="text-xs font-bold uppercase text-content-muted">Véhicules indisponibles</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{unavailableVehicles}</p>
        </article>
      </section>

      <section className={`${logisticsCard} p-5`}>
        <div className="flex items-center gap-2">
          <Icon name="warning" className="h-5 w-5 text-brand-orange" />
          <h2 className="text-lg font-black text-content-primary">Alertes maintenance</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {alerts.map((event) => (
            <article key={event.id} className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/50 dark:bg-red-950/20">
              <p className="font-black text-red-700 dark:text-red-200">{alertLabel[event.alert!]}</p>
              <p className="mt-1 text-content-primary">{event.vehiclePlate} · {event.title}</p>
              <p className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">
                Assignation bloquée tant que le véhicule est indisponible.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${logisticsCard} overflow-hidden`}>
        <div className="flex items-center gap-2 border-b border-surface-border-subtle p-5">
          <Icon name="settings" className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-black text-content-primary">Suivi entretien véhicules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-content-muted">
              <tr>
                <th className="px-5 py-3">Véhicule</th>
                <th className="px-5 py-3">Type entretien</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Coût</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Prochain contrôle</th>
                <th className="px-5 py-3">Disponibilité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border-subtle">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-5 py-4">
                    <p className="font-black text-content-primary">{event.vehiclePlate}</p>
                    <p className="text-xs text-content-muted">{event.title}</p>
                  </td>
                  <td className="px-5 py-4 text-content-muted">{typeLabel[event.type]}</td>
                  <td className="px-5 py-4 text-content-muted">{event.dueDate}</td>
                  <td className="px-5 py-4 text-content-muted">{event.cost} $</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${statusStyle[event.status]}`}>
                      {statusLabel[event.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-content-muted">{event.nextControlAt}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${event.vehicleAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {event.vehicleAvailable ? 'Disponible' : 'Indisponible'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
