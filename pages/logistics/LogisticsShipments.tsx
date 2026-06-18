import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { Shipment } from '../../components/logistics/logistics-types';
import { getShipments, type DataMode, type LogisticsShipmentRow } from '../../services/logistics-api';
import { logisticsCard } from './logistics-ui';

const fallbackShipments: LogisticsShipmentRow[] = [
  {
    id: 'shp-001',
    orderId: 'LX-2001',
    customerName: 'Marie C.',
    status: 'pending',
    pickupZone: 'Gombe',
    deliveryZone: 'Lingwala',
  },
  {
    id: 'shp-002',
    orderId: 'LX-2007',
    customerName: 'Francois G.',
    status: 'assigned',
    pickupZone: 'Limete',
    deliveryZone: 'Gombe',
  },
  {
    id: 'shp-003',
    orderId: 'LX-2014',
    customerName: 'Monique V.',
    status: 'delayed',
    pickupZone: 'Ngaliema',
    deliveryZone: 'Kinshasa',
  },
];

const statusLabel: Record<Shipment['status'], string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'En route',
  delivered: 'Livré',
  delayed: 'Retard',
  failed: 'Incident',
  cancelled: 'Annulé',
};

export const LogisticsShipments: React.FC = () => {
  const [shipments, setShipments] = useState<LogisticsShipmentRow[]>(fallbackShipments);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');

  useEffect(() => {
    let mounted = true;
    getShipments(fallbackShipments).then((result) => {
      if (!mounted) return;
      setShipments(result.data);
      setDataMode(result.mode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className={`${logisticsCard} overflow-hidden`}>
      <div className={`border-b px-4 py-3 text-sm font-bold ${
        dataMode === 'backend'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }`}>
        {dataMode === 'backend' ? 'Shipments dérivés du backend logistique' : 'Mode dégradé — shipments locaux'}
      </div>
      <div className="flex flex-col gap-3 border-b border-surface-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon name="archive-box" className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-black text-content-primary">Shipments</h2>
        </div>
        <span className="w-fit rounded-full bg-surface-muted px-3 py-1 text-xs font-black text-content-muted">
          {shipments.length} livraisons
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:hidden">
        {shipments.map((shipment) => (
          <article key={shipment.id} className="rounded-2xl border border-surface-border-subtle bg-surface-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-content-primary">{shipment.id}</p>
              <p className="mt-1 text-xs font-bold text-content-muted">{shipment.orderId} · {shipment.customerName}</p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-blue/10 px-2 py-1 text-xs font-bold text-brand-blue">
              {statusLabel[shipment.status]}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-content-muted">
            <div className="rounded-xl bg-surface-muted px-3 py-2">
              <p className="font-bold">Pickup</p>
              <p className="mt-1 text-content-primary">{shipment.pickupZone}</p>
            </div>
            <div className="rounded-xl bg-surface-muted px-3 py-2">
              <p className="font-bold">Delivery</p>
              <p className="mt-1 text-content-primary">{shipment.deliveryZone}</p>
            </div>
          </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase text-content-muted">
          <tr>
            <th className="px-5 py-3">Shipment</th>
            <th className="px-5 py-3">Commande</th>
            <th className="px-5 py-3">Client</th>
            <th className="px-5 py-3">Trajet</th>
            <th className="px-5 py-3">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border-subtle">
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td className="px-5 py-4 font-black text-content-primary">{shipment.id}</td>
              <td className="px-5 py-4 text-content-muted">{shipment.orderId}</td>
              <td className="px-5 py-4 text-content-muted">{shipment.customerName}</td>
              <td className="px-5 py-4 text-content-muted">
                {shipment.pickupZone} vers {shipment.deliveryZone}
              </td>
              <td className="px-5 py-4">
                <span className="rounded-full bg-brand-blue/10 px-2 py-1 text-xs font-bold text-brand-blue">
                  {statusLabel[shipment.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </section>
  );
};
