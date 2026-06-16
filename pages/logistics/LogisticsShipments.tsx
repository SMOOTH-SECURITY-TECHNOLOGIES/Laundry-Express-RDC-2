import React from 'react';
import { Icon } from '../../components/Icon';
import type { Shipment } from '../../components/logistics/logistics-types';
import { logisticsCard } from './logistics-ui';

const shipments: Shipment[] = [
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

export const LogisticsShipments: React.FC = () => (
  <section className={`${logisticsCard} overflow-hidden`}>
    <div className="flex items-center gap-2 border-b border-surface-border-subtle p-5">
      <Icon name="archive-box" className="h-5 w-5 text-brand-blue" />
      <h2 className="text-lg font-black text-content-primary">Shipments</h2>
    </div>
    <div className="overflow-x-auto">
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
                  {shipment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
