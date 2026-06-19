import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { LogisticsStatus, Shipment } from '../../components/logistics/logistics-types';
import { getShipments, type DataMode, type LogisticsShipmentRow } from '../../services/logistics-api';
import { logisticsCard } from './logistics-ui';

type ShipmentFilter = 'all' | LogisticsStatus;

const fallbackShipments: LogisticsShipmentRow[] = [
  {
    id: 'shp-001',
    orderId: 'LX-2001',
    customerName: 'Marie C.',
    status: 'pending',
    pickupZone: 'Gombe',
    deliveryZone: 'Lingwala',
    pickupAddress: 'Av. Lumumba 42',
    deliveryAddress: 'Avenue Kalembelembe',
    tripId: 'trip-001',
    driverName: 'À assigner',
    vehiclePlate: 'Véhicule à confirmer',
    etaMinutes: 18,
    createdAt: '10:02',
    updatedAt: '10:08',
    proofRequired: false,
    incidentCount: 0,
  },
  {
    id: 'shp-002',
    orderId: 'LX-2007',
    customerName: 'Francois G.',
    status: 'assigned',
    pickupZone: 'Limete',
    deliveryZone: 'Gombe',
    pickupAddress: 'Av. Kasavubu 15',
    deliveryAddress: 'Boulevard du 30 Juin',
    tripId: 'trip-002',
    driverName: 'Mutombo P.',
    vehiclePlate: 'KIN-118-VN',
    etaMinutes: 24,
    createdAt: '09:58',
    updatedAt: '10:12',
    proofRequired: false,
    incidentCount: 0,
  },
  {
    id: 'shp-003',
    orderId: 'LX-2014',
    customerName: 'Monique V.',
    status: 'delayed',
    pickupZone: 'Ngaliema',
    deliveryZone: 'Kinshasa',
    pickupAddress: 'Route de Matadi',
    deliveryAddress: 'Centre-ville Kinshasa',
    tripId: 'trip-003',
    driverName: 'Kalonji S.',
    vehiclePlate: 'KIN-207-MT',
    etaMinutes: 36,
    createdAt: '09:42',
    updatedAt: '10:18',
    proofRequired: false,
    incidentCount: 1,
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

const statusTone: Record<Shipment['status'], string> = {
  pending: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  delayed: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-700',
};

const filters: Array<[ShipmentFilter, string]> = [
  ['all', 'Tous'],
  ['pending', 'En attente'],
  ['assigned', 'Assignés'],
  ['in_transit', 'En route'],
  ['delivered', 'Livrés'],
  ['delayed', 'Retards'],
  ['failed', 'Incidents'],
];

const normalize = (value: string) => value.trim().toLowerCase();

export const LogisticsShipments: React.FC = () => {
  const [shipments, setShipments] = useState<LogisticsShipmentRow[]>(fallbackShipments);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [filter, setFilter] = useState<ShipmentFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState(fallbackShipments[0].id);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, LogisticsStatus>>({});
  const [incidentOverrides, setIncidentOverrides] = useState<Record<string, number>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getShipments(fallbackShipments).then((result) => {
      if (!mounted) return;
      setShipments(result.data);
      setDataMode(result.mode);
      setSelectedShipmentId((current) =>
        result.data.some((shipment) => shipment.id === current) ? current : result.data[0]?.id ?? ''
      );
    });
    return () => {
      mounted = false;
    };
  }, []);

  const effectiveShipments = useMemo(
    () =>
      shipments.map((shipment) => ({
        ...shipment,
        status: statusOverrides[shipment.id] ?? shipment.status,
        incidentCount: incidentOverrides[shipment.id] ?? shipment.incidentCount ?? 0,
      })),
    [incidentOverrides, shipments, statusOverrides]
  );

  const metrics = useMemo(() => ({
    total: effectiveShipments.length,
    pending: effectiveShipments.filter((shipment) => shipment.status === 'pending').length,
    inTransit: effectiveShipments.filter((shipment) => shipment.status === 'in_transit' || shipment.status === 'assigned').length,
    delivered: effectiveShipments.filter((shipment) => shipment.status === 'delivered').length,
    incidents: effectiveShipments.filter((shipment) => shipment.status === 'failed' || shipment.status === 'delayed' || (shipment.incidentCount ?? 0) > 0).length,
  }), [effectiveShipments]);

  const visibleShipments = useMemo(() => {
    const term = normalize(query);
    return effectiveShipments.filter((shipment) => {
      const statusMatch = filter === 'all' || shipment.status === filter;
      const textMatch = !term || [
        shipment.id,
        shipment.orderId,
        shipment.customerName,
        shipment.pickupZone,
        shipment.deliveryZone,
        shipment.driverName || '',
        shipment.vehiclePlate || '',
      ].some((value) => normalize(value).includes(term));
      return statusMatch && textMatch;
    });
  }, [effectiveShipments, filter, query]);

  useEffect(() => {
    if (visibleShipments.length === 0) return;
    if (visibleShipments.some((shipment) => shipment.id === selectedShipmentId)) return;
    setSelectedShipmentId(visibleShipments[0].id);
  }, [selectedShipmentId, visibleShipments]);

  const selectedShipment = effectiveShipments.find((shipment) => shipment.id === selectedShipmentId) ?? visibleShipments[0] ?? effectiveShipments[0];

  const pushAction = (message: string) => {
    setActionMessage(message);
  };

  const updateShipmentStatus = (shipment: LogisticsShipmentRow, status: LogisticsStatus) => {
    setStatusOverrides((current) => ({ ...current, [shipment.id]: status }));
    setSelectedShipmentId(shipment.id);
    pushAction(`${shipment.id} mis à jour: ${statusLabel[status]}`);
  };

  const reportIncident = (shipment: LogisticsShipmentRow) => {
    setIncidentOverrides((current) => ({ ...current, [shipment.id]: (current[shipment.id] ?? shipment.incidentCount ?? 0) + 1 }));
    setStatusOverrides((current) => ({ ...current, [shipment.id]: 'failed' }));
    setSelectedShipmentId(shipment.id);
    pushAction(`Incident shipment enregistré: ${shipment.id}`);
  };

  const openTracking = (shipment: LogisticsShipmentRow) => {
    sessionStorage.setItem('logisticsFocusTripId', shipment.tripId || shipment.id);
    window.location.hash = 'tracking';
  };

  const openTripDetails = (shipment: LogisticsShipmentRow) => {
    sessionStorage.setItem('logisticsFocusTripId', shipment.tripId || shipment.id);
    window.location.hash = 'trip-details';
  };

  const shipmentActions = (shipment: LogisticsShipmentRow, compact = false) => (
    <div className={`flex ${compact ? 'flex-wrap' : 'flex-wrap justify-end'} gap-2`}>
      <button type="button" onClick={() => setSelectedShipmentId(shipment.id)} className="rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-black text-content-primary hover:bg-surface-muted">
        Voir détail
      </button>
      <button type="button" onClick={() => openTracking(shipment)} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50">
        Ouvrir tracking
      </button>
      <button type="button" onClick={() => openTripDetails(shipment)} className="rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-black text-content-primary hover:bg-surface-muted">
        Trip details
      </button>
      <button type="button" onClick={() => reportIncident(shipment)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50">
        Signaler incident
      </button>
      <button type="button" onClick={() => updateShipmentStatus(shipment, 'delivered')} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700">
        Marquer livré
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <section className={`${logisticsCard} overflow-hidden`}>
        <div className={`border-b px-4 py-3 text-sm font-bold ${
          dataMode === 'backend'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-orange-200 bg-orange-50 text-orange-700'
        }`}>
          {dataMode === 'backend' ? 'Shipments dérivés du backend logistique' : 'Mode dégradé — shipments locaux'}
        </div>

        <div className="flex flex-col gap-4 border-b border-surface-border-subtle p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="archive-box" className="h-5 w-5 text-brand-blue" />
              <h2 className="text-lg font-black text-content-primary">Shipments V1</h2>
            </div>
            <p className="mt-1 text-sm text-content-muted">Suivi opérationnel des livraisons, dérivé des missions dispatch.</p>
          </div>
          <span className="w-fit rounded-full bg-surface-muted px-3 py-1 text-xs font-black text-content-muted">
            {visibleShipments.length}/{effectiveShipments.length} livraisons
          </span>
        </div>

        {actionMessage && (
          <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700">
            {actionMessage}
          </div>
        )}

        <div className="grid gap-3 border-b border-surface-border-subtle p-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['Total shipments', metrics.total, 'archive-box'],
            ['En attente', metrics.pending, 'clock'],
            ['En transit', metrics.inTransit, 'truck'],
            ['Livrés', metrics.delivered, 'check'],
            ['Incidents', metrics.incidents, 'warning'],
          ].map(([label, value, icon]) => (
            <div key={label} className="rounded-2xl bg-surface-muted p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-content-muted">{label}</p>
                <Icon name={icon as React.ComponentProps<typeof Icon>['name']} className="h-4 w-4 text-brand-blue" />
              </div>
              <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-b border-surface-border-subtle p-4">
          <label className="block">
            <span className="sr-only">Rechercher shipment</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher shipment, commande, client, zone, chauffeur..."
              className="w-full rounded-xl border border-surface-border-subtle bg-surface-card px-4 py-3 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {filters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${
                  filter === value ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-muted hover:bg-surface-page'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {visibleShipments.map((shipment) => (
            <article key={shipment.id} className="rounded-2xl border border-surface-border-subtle bg-surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-content-primary">{shipment.id}</p>
                  <p className="mt-1 text-xs font-bold text-content-muted">{shipment.orderId} · {shipment.customerName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${statusTone[shipment.status]}`}>
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
                <div className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="font-bold">Chauffeur</p>
                  <p className="mt-1 text-content-primary">{shipment.driverName}</p>
                </div>
                <div className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="font-bold">ETA</p>
                  <p className="mt-1 text-content-primary">{shipment.etaMinutes ?? 0} min</p>
                </div>
              </div>
              <div className="mt-4">{shipmentActions(shipment, true)}</div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-content-muted">
              <tr>
                <th className="px-5 py-3">Shipment</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Trajet</th>
                <th className="px-5 py-3">Ressources</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border-subtle">
              {visibleShipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td className="px-5 py-4">
                    <p className="font-black text-content-primary">{shipment.id}</p>
                    <p className="text-xs font-bold text-content-muted">{shipment.orderId}</p>
                  </td>
                  <td className="px-5 py-4 text-content-muted">{shipment.customerName}</td>
                  <td className="px-5 py-4 text-content-muted">
                    <p>{shipment.pickupZone} vers {shipment.deliveryZone}</p>
                    <p className="text-xs">{shipment.etaMinutes ?? 0} min · incidents {shipment.incidentCount ?? 0}</p>
                  </td>
                  <td className="px-5 py-4 text-content-muted">
                    <p>{shipment.driverName}</p>
                    <p className="text-xs">{shipment.vehiclePlate}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusTone[shipment.status]}`}>
                      {statusLabel[shipment.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">{shipmentActions(shipment)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleShipments.length === 0 && (
          <div className="p-8 text-center text-sm font-bold text-content-muted">
            Aucun shipment ne correspond au filtre.
          </div>
        )}
      </section>

      {selectedShipment && (
        <section className={`${logisticsCard} p-5`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="document-text" className="h-5 w-5 text-brand-blue" />
                <h2 className="text-lg font-black text-content-primary">Détail shipment</h2>
              </div>
              <p className="mt-1 text-sm text-content-muted">{selectedShipment.id} · {selectedShipment.orderId} · {selectedShipment.customerName}</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${statusTone[selectedShipment.status]}`}>
              {statusLabel[selectedShipment.status]}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Pickup', selectedShipment.pickupAddress || selectedShipment.pickupZone],
              ['Delivery', selectedShipment.deliveryAddress || selectedShipment.deliveryZone],
              ['Chauffeur', selectedShipment.driverName || 'À assigner'],
              ['Véhicule', selectedShipment.vehiclePlate || 'À confirmer'],
              ['ETA', `${selectedShipment.etaMinutes ?? 0} min`],
              ['Créé', selectedShipment.createdAt || '--'],
              ['Mis à jour', selectedShipment.updatedAt || '--'],
              ['Preuve', selectedShipment.proofRequired ? 'Requise' : 'Non requise'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface-muted p-4">
                <p className="text-xs font-bold uppercase text-content-muted">{label}</p>
                <p className="mt-1 text-sm font-black text-content-primary">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">{shipmentActions(selectedShipment, true)}</div>
        </section>
      )}
    </div>
  );
};
