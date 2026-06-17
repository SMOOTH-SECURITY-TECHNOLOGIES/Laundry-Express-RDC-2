import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { Vehicle } from '../../components/logistics/logistics-types';
import { getVehicles, type DataMode } from '../../services/logistics-api';
import { logisticsCard } from './logistics-ui';

type VehicleForm = Pick<
  Vehicle,
  'plate' | 'type' | 'status' | 'assignedDriverName' | 'zone' | 'location' | 'mileageKm' | 'insuranceExpiresAt'
> & {
  maintenanceStatus: Vehicle['maintenance']['status'];
  maintenanceNotes: string;
};

type FleetFilter = 'all' | 'active' | 'maintenance' | 'unavailable';

const DRIVERS = ['Kabongo M.', 'Tshimanga A.', 'Mutombo P.', 'Kalonji S.', 'Ngoy L.'];
const ZONES = ['Gombe', 'Limete', 'Ngaliema', 'Masina', 'Kintambo', 'Lingwala'];

const initialVehicles: Vehicle[] = [
  {
    id: 'veh-001',
    plate: 'KIN-042-MT',
    type: 'moto',
    status: 'in_transit',
    driverId: 'drv-001',
    assignedDriverName: 'Kabongo M.',
    zone: 'Gombe',
    location: 'Av. Tombalbaye',
    lastKnownLocation: 'Av. Tombalbaye',
    mileageKm: 18420,
    insuranceExpiresAt: '2026-11-30',
    maintenance: { status: 'ok', nextServiceAtKm: 20000, notes: 'RAS' },
  },
  {
    id: 'veh-002',
    plate: 'KIN-118-VN',
    type: 'van',
    status: 'assigned',
    driverId: 'drv-002',
    assignedDriverName: 'Tshimanga A.',
    zone: 'Limete',
    location: 'Boulevard Lumumba',
    lastKnownLocation: 'Boulevard Lumumba',
    mileageKm: 42100,
    insuranceExpiresAt: '2026-08-15',
    maintenance: { status: 'scheduled', nextServiceAtKm: 45000, notes: 'Vidange planifiée' },
  },
  {
    id: 'veh-003',
    plate: 'KIN-207-MT',
    type: 'moto',
    status: 'failed',
    driverId: 'drv-003',
    assignedDriverName: 'Mutombo P.',
    zone: 'Ngaliema',
    location: 'Route de Matadi',
    lastKnownLocation: 'Route de Matadi',
    mileageKm: 29680,
    insuranceExpiresAt: '2026-07-10',
    maintenance: { status: 'in_progress', nextServiceAtKm: 30000, notes: 'Freinage en contrôle' },
  },
  {
    id: 'veh-004',
    plate: 'KIN-301-CR',
    type: 'car',
    status: 'cancelled',
    zone: 'Masina',
    location: 'Dépôt Masina',
    lastKnownLocation: 'Dépôt Masina',
    mileageKm: 55740,
    insuranceExpiresAt: '2026-06-30',
    maintenance: { status: 'overdue', nextServiceAtKm: 55000, notes: 'Assurance et contrôle à renouveler' },
  },
];

const emptyForm: VehicleForm = {
  plate: '',
  type: 'moto',
  status: 'pending',
  assignedDriverName: '',
  zone: 'Gombe',
  location: '',
  mileageKm: 0,
  insuranceExpiresAt: '2026-12-31',
  maintenanceStatus: 'ok',
  maintenanceNotes: '',
};

const statusLabel: Record<Vehicle['status'], string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'Actif',
  delivered: 'Livré',
  delayed: 'Retard',
  failed: 'Indisponible',
  cancelled: 'Désactivé',
};

const typeLabel: Record<Vehicle['type'], string> = {
  moto: 'Moto',
  car: 'Voiture',
  van: 'Camionnette',
};

const maintenanceLabel: Record<Vehicle['maintenance']['status'], string> = {
  ok: 'OK',
  scheduled: 'Planifié',
  in_progress: 'En maintenance',
  overdue: 'En retard',
};

const typeTone: Record<Vehicle['type'], string> = {
  moto: 'bg-blue-50 text-blue-700',
  car: 'bg-purple-50 text-purple-700',
  van: 'bg-amber-50 text-amber-700',
};

const isMaintenanceBlocked = (vehicle: Vehicle) =>
  vehicle.maintenance.status === 'in_progress' || vehicle.maintenance.status === 'overdue';

const isUnavailable = (vehicle: Vehicle) =>
  vehicle.status === 'failed' || vehicle.status === 'cancelled' || isMaintenanceBlocked(vehicle);

const isActive = (vehicle: Vehicle) => vehicle.status === 'in_transit' || vehicle.status === 'assigned';

const daysUntil = (date: string) => {
  const target = new Date(`${date}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
};

const vehicleHealth = (vehicle: Vehicle): { label: string; tone: string; detail: string } => {
  if (vehicle.status === 'cancelled') {
    return { label: 'Indisponible', tone: 'bg-red-50 text-red-700', detail: 'Véhicule désactivé' };
  }
  if (vehicle.status === 'failed') {
    return { label: 'Indisponible', tone: 'bg-red-50 text-red-700', detail: 'Incident ou panne' };
  }
  if (vehicle.maintenance.status === 'overdue') {
    return { label: 'Maintenance', tone: 'bg-orange-50 text-orange-700', detail: 'Contrôle dépassé' };
  }
  if (vehicle.maintenance.status === 'in_progress') {
    return { label: 'Maintenance', tone: 'bg-orange-50 text-orange-700', detail: 'Entretien en cours' };
  }
  const insuranceDays = daysUntil(vehicle.insuranceExpiresAt);
  if (insuranceDays !== null && insuranceDays < 0) {
    return { label: 'Assurance', tone: 'bg-red-50 text-red-700', detail: 'Assurance expirée' };
  }
  if (insuranceDays !== null && insuranceDays <= 30) {
    return { label: 'À surveiller', tone: 'bg-amber-50 text-amber-700', detail: `Assurance dans ${insuranceDays} j` };
  }
  if (vehicle.maintenance.status === 'scheduled') {
    return { label: 'Planifié', tone: 'bg-blue-50 text-blue-700', detail: 'Entretien planifié' };
  }
  return { label: 'Disponible', tone: 'bg-green-50 text-green-700', detail: 'Prêt à assigner' };
};

const toVehicle = (form: VehicleForm, id: string): Vehicle => {
  const maintenanceStatus = form.status === 'failed' || form.status === 'cancelled'
    ? form.maintenanceStatus === 'ok'
      ? 'in_progress'
      : form.maintenanceStatus
    : form.maintenanceStatus;

  return {
    id,
    plate: form.plate.trim().toUpperCase(),
    type: form.type,
    status: form.status,
    assignedDriverName: form.assignedDriverName || undefined,
    driverId: form.assignedDriverName ? `drv-${form.assignedDriverName.toLowerCase().replace(/[^a-z]/g, '-')}` : undefined,
    zone: form.zone,
    location: form.location,
    lastKnownLocation: form.location,
    mileageKm: Number(form.mileageKm) || 0,
    insuranceExpiresAt: form.insuranceExpiresAt,
    maintenance: {
      status: maintenanceStatus,
      nextServiceAtKm: (Number(form.mileageKm) || 0) + 2500,
      notes: form.maintenanceNotes,
    },
  };
};

const toForm = (vehicle: Vehicle): VehicleForm => ({
  plate: vehicle.plate,
  type: vehicle.type,
  status: vehicle.status,
  assignedDriverName: vehicle.assignedDriverName ?? '',
  zone: vehicle.zone,
  location: vehicle.location,
  mileageKm: vehicle.mileageKm,
  insuranceExpiresAt: vehicle.insuranceExpiresAt,
  maintenanceStatus: vehicle.maintenance.status,
  maintenanceNotes: vehicle.maintenance.notes ?? '',
});

export const LogisticsFleet: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [assigningVehicleId, setAssigningVehicleId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicles[0]?.id ?? '');
  const [filter, setFilter] = useState<FleetFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Vehicle['type']>('all');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];

  const kpis = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter(isActive).length,
    maintenance: vehicles.filter(isMaintenanceBlocked).length,
    unavailable: vehicles.filter(isUnavailable).length,
  }), [vehicles]);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesQuery = !normalizedQuery || [
        vehicle.plate,
        vehicle.assignedDriverName,
        vehicle.zone,
        vehicle.location,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));

      const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
      const matchesFleetFilter =
        filter === 'all' ||
        (filter === 'active' && isActive(vehicle)) ||
        (filter === 'maintenance' && isMaintenanceBlocked(vehicle)) ||
        (filter === 'unavailable' && isUnavailable(vehicle));

      return matchesQuery && matchesType && matchesFleetFilter;
    });
  }, [filter, query, typeFilter, vehicles]);

  useEffect(() => {
    let mounted = true;
    getVehicles(initialVehicles).then((result) => {
      if (!mounted) return;
      setVehicles(result.data);
      setSelectedVehicleId(result.data[0]?.id ?? '');
      setDataMode(result.mode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openCreateForm = () => {
    setEditingVehicleId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setActionMessage(null);
  };

  const openEditForm = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setForm(toForm(vehicle));
    setIsFormOpen(true);
    setSelectedVehicleId(vehicle.id);
    setActionMessage(null);
  };

  const saveVehicle = () => {
    if (!form.plate.trim()) {
      setActionMessage('Plaque obligatoire.');
      return;
    }
    if (!form.location.trim()) {
      setActionMessage('Localisation obligatoire.');
      return;
    }

    if (editingVehicleId) {
      const updated = toVehicle(form, editingVehicleId);
      setVehicles((current) => current.map((vehicle) => (vehicle.id === editingVehicleId ? updated : vehicle)));
      setSelectedVehicleId(updated.id);
      setActionMessage(`Véhicule ${updated.plate} modifié.`);
    } else {
      const createdId = `veh-${String(vehicles.length + 1).padStart(3, '0')}`;
      const created = toVehicle(form, createdId);
      setVehicles((current) => [created, ...current]);
      setSelectedVehicleId(created.id);
      setActionMessage(`Véhicule ${created.plate} ajouté.`);
    }
    setIsFormOpen(false);
    setEditingVehicleId(null);
    setForm(emptyForm);
  };

  const disableVehicle = (vehicleId: string) => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === vehicleId
          ? { ...vehicle, status: 'cancelled', assignedDriverName: undefined, driverId: undefined }
          : vehicle
      )
    );
    setSelectedVehicleId(vehicleId);
    setActionMessage('Véhicule désactivé et retiré des assignations.');
  };

  const activateVehicle = (vehicleId: string) => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === vehicleId
          ? { ...vehicle, status: 'pending', maintenance: { ...vehicle.maintenance, status: 'ok' } }
          : vehicle
      )
    );
    setSelectedVehicleId(vehicleId);
    setActionMessage('Véhicule réactivé et disponible pour assignation.');
  };

  const assignDriver = (vehicleId: string, driverName: string) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (vehicle && isUnavailable(vehicle)) {
      setActionMessage(`Assignation bloquée: ${vehicle.plate} indisponible.`);
      setAssigningVehicleId(null);
      setSelectedVehicleId(vehicleId);
      return;
    }

    setVehicles((current) =>
      current.map((item) =>
        item.id === vehicleId
          ? {
              ...item,
              status: item.status === 'pending' || item.status === 'delivered' ? 'assigned' : item.status,
              assignedDriverName: driverName,
              driverId: `drv-${driverName.toLowerCase().replace(/[^a-z]/g, '-')}`,
            }
          : item
      )
    );
    setAssigningVehicleId(null);
    setSelectedVehicleId(vehicleId);
    setActionMessage(`${driverName} assigné au véhicule.`);
  };

  const fleetFilters: Array<{ key: FleetFilter; label: string; value: number }> = [
    { key: 'all', label: 'Tous', value: kpis.total },
    { key: 'active', label: 'Actifs', value: kpis.active },
    { key: 'maintenance', label: 'Maintenance', value: kpis.maintenance },
    { key: 'unavailable', label: 'Indisponibles', value: kpis.unavailable },
  ];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        dataMode === 'backend'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }`}>
        {dataMode === 'backend' ? 'Données véhicules connectées au backend' : 'Mode dégradé — données véhicules locales'}
      </div>

      {actionMessage && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {actionMessage}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total véhicules', value: kpis.total, icon: 'truck' as const },
          { label: 'Actifs', value: kpis.active, icon: 'check' as const },
          { label: 'En maintenance', value: kpis.maintenance, icon: 'settings' as const },
          { label: 'Indisponibles', value: kpis.unavailable, icon: 'warning' as const },
        ].map((kpi) => (
          <article key={kpi.label} className={`${logisticsCard} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-content-muted">{kpi.label}</p>
                <p className="mt-2 text-2xl font-black text-content-primary">{kpi.value}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Icon name={kpi.icon} className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`${logisticsCard} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-surface-border-subtle p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="truck" className="h-5 w-5 text-brand-blue" />
                <h2 className="text-lg font-black text-content-primary">Fleet Management</h2>
              </div>
              <p className="mt-1 text-sm text-content-muted">Moto, voiture et camionnette rattachées aux opérations Laundry Express.</p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700"
            >
              <Icon name="plus" className="h-4 w-4" />
              Ajouter véhicule
            </button>
          </div>

          <div className="space-y-3 border-b border-surface-border-subtle p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {fleetFilters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-black ${
                    filter === item.key
                      ? 'bg-brand-blue text-white'
                      : 'bg-surface-muted text-content-muted hover:bg-brand-blue/10 hover:text-brand-blue'
                  }`}
                >
                  {item.label} <span className="ml-1 rounded-full bg-white/20 px-1.5">{item.value}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_180px]">
              <label className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-surface-border-subtle bg-surface-card pl-9 pr-3 text-sm text-content-primary"
                  placeholder="Rechercher plaque, chauffeur, zone..."
                />
              </label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'all' | Vehicle['type'])}
                className="min-h-[44px] rounded-xl border border-surface-border-subtle bg-surface-card px-3 text-sm font-bold text-content-primary"
              >
                <option value="all">Tous les types</option>
                <option value="moto">Moto</option>
                <option value="car">Voiture</option>
                <option value="van">Camionnette</option>
              </select>
            </div>
          </div>

          {isFormOpen && (
            <div className="border-b border-surface-border-subtle bg-surface-muted p-5">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-xs font-bold text-content-muted">
                  Plaque
                  <input
                    value={form.plate}
                    onChange={(event) => setForm((current) => ({ ...current, plate: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                    placeholder="KIN-000-MT"
                  />
                </label>
                <label className="text-xs font-bold text-content-muted">
                  Type
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as Vehicle['type'] }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                  >
                    <option value="moto">Moto</option>
                    <option value="car">Voiture</option>
                    <option value="van">Camionnette</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-content-muted">
                  Chauffeur assigné
                  <select
                    value={form.assignedDriverName}
                    onChange={(event) => setForm((current) => ({ ...current, assignedDriverName: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                  >
                    <option value="">Non assigné</option>
                    {DRIVERS.map((driver) => (
                      <option key={driver} value={driver}>{driver}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-content-muted">
                  Statut
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Vehicle['status'] }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                  >
                    {Object.entries(statusLabel).map(([status, label]) => (
                      <option key={status} value={status}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-content-muted">
                  Localisation
                  <input
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                    placeholder="Dépôt Gombe"
                  />
                </label>
                <label className="text-xs font-bold text-content-muted">
                  Zone
                  <select
                    value={form.zone}
                    onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                  >
                    {ZONES.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-content-muted">
                  Kilométrage
                  <input
                    type="number"
                    value={form.mileageKm}
                    onChange={(event) => setForm((current) => ({ ...current, mileageKm: Number(event.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                  />
                </label>
                <label className="text-xs font-bold text-content-muted">
                  Assurance
                  <input
                    type="date"
                    value={form.insuranceExpiresAt}
                    onChange={(event) => setForm((current) => ({ ...current, insuranceExpiresAt: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                  />
                </label>
                <label className="text-xs font-bold text-content-muted md:col-span-2">
                  Entretien
                  <select
                    value={form.maintenanceStatus}
                    onChange={(event) => setForm((current) => ({ ...current, maintenanceStatus: event.target.value as Vehicle['maintenance']['status'] }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                  >
                    {Object.entries(maintenanceLabel).map(([status, label]) => (
                      <option key={status} value={status}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-content-muted md:col-span-2">
                  Note entretien
                  <input
                    value={form.maintenanceNotes}
                    onChange={(event) => setForm((current) => ({ ...current, maintenanceNotes: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                    placeholder="Contrôle, assurance, réparation..."
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveVehicle}
                  className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-surface-border-subtle px-4 py-2 text-sm font-black text-content-muted hover:bg-surface-card"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-3 p-4 lg:hidden">
            {filteredVehicles.map((vehicle) => {
              const health = vehicleHealth(vehicle);
              return (
                <article
                  key={vehicle.id}
                  className={`rounded-2xl border p-4 ${
                    selectedVehicle?.id === vehicle.id ? 'border-brand-blue bg-brand-blue/5' : 'border-surface-border-subtle bg-surface-card'
                  }`}
                >
                  <button type="button" onClick={() => setSelectedVehicleId(vehicle.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-content-primary">{vehicle.plate}</p>
                        <p className="mt-1 text-xs font-bold text-content-muted">{typeLabel[vehicle.type]} • {vehicle.zone}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-black ${health.tone}`}>{health.label}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-content-muted">
                      <span>{vehicle.assignedDriverName ?? 'Non assigné'}</span>
                      <span>{vehicle.mileageKm.toLocaleString('fr-FR')} km</span>
                      <span>{vehicle.location}</span>
                      <span>{maintenanceLabel[vehicle.maintenance.status]}</span>
                    </div>
                  </button>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEditForm(vehicle)} className="rounded-lg border border-surface-border-subtle px-3 py-2 text-xs font-bold text-content-muted">Modifier</button>
                    <button type="button" onClick={() => setAssigningVehicleId(assigningVehicleId === vehicle.id ? null : vehicle.id)} className="rounded-lg border border-surface-border-subtle px-3 py-2 text-xs font-bold text-brand-blue">Assigner</button>
                    {vehicle.status === 'cancelled' ? (
                      <button type="button" onClick={() => activateVehicle(vehicle.id)} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-bold text-green-700">Réactiver</button>
                    ) : (
                      <button type="button" onClick={() => disableVehicle(vehicle.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Désactiver</button>
                    )}
                  </div>
                  {assigningVehicleId === vehicle.id && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DRIVERS.map((driver) => (
                        <button key={driver} type="button" onClick={() => assignDriver(vehicle.id, driver)} className="rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-content-primary">
                          {driver}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-content-muted">
                <tr>
                  <th className="px-5 py-3">Plaque</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Chauffeur</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Localisation</th>
                  <th className="px-5 py-3">Kilométrage</th>
                  <th className="px-5 py-3">Assurance</th>
                  <th className="px-5 py-3">Entretien</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border-subtle">
                {filteredVehicles.map((vehicle) => {
                  const health = vehicleHealth(vehicle);
                  return (
                    <tr key={vehicle.id} className={selectedVehicle?.id === vehicle.id ? 'bg-brand-blue/5' : undefined}>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => setSelectedVehicleId(vehicle.id)} className="font-black text-content-primary hover:text-brand-blue">
                          {vehicle.plate}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-black ${typeTone[vehicle.type]}`}>{typeLabel[vehicle.type]}</span>
                      </td>
                      <td className="px-5 py-4 text-content-muted">{vehicle.assignedDriverName ?? 'Non assigné'}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-black ${health.tone}`}>{statusLabel[vehicle.status]}</span>
                      </td>
                      <td className="px-5 py-4 text-content-muted">{vehicle.location}</td>
                      <td className="px-5 py-4 text-content-muted">{vehicle.mileageKm.toLocaleString('fr-FR')} km</td>
                      <td className="px-5 py-4 text-content-muted">{vehicle.insuranceExpiresAt}</td>
                      <td className="px-5 py-4 text-content-muted">{maintenanceLabel[vehicle.maintenance.status]}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openEditForm(vehicle)} className="rounded-lg border border-surface-border-subtle px-2 py-1 text-xs font-bold text-content-muted hover:bg-surface-muted">Modifier</button>
                          <button type="button" onClick={() => setAssigningVehicleId(assigningVehicleId === vehicle.id ? null : vehicle.id)} className="rounded-lg border border-surface-border-subtle px-2 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue/10">Assigner</button>
                          {vehicle.status === 'cancelled' ? (
                            <button type="button" onClick={() => activateVehicle(vehicle.id)} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-50">Réactiver</button>
                          ) : (
                            <button type="button" onClick={() => disableVehicle(vehicle.id)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Désactiver</button>
                          )}
                        </div>
                        {assigningVehicleId === vehicle.id && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {DRIVERS.map((driver) => (
                              <button key={driver} type="button" onClick={() => assignDriver(vehicle.id, driver)} className="rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-content-primary hover:bg-brand-blue/10">
                                {driver}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedVehicle && (
          <aside className={`${logisticsCard} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-content-muted">Détail véhicule</p>
                <h3 className="mt-1 text-xl font-black text-content-primary">{selectedVehicle.plate}</h3>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-black ${vehicleHealth(selectedVehicle).tone}`}>
                {vehicleHealth(selectedVehicle).label}
              </span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ['Type', typeLabel[selectedVehicle.type]],
                ['Chauffeur', selectedVehicle.assignedDriverName ?? 'Non assigné'],
                ['Zone', selectedVehicle.zone],
                ['Localisation', selectedVehicle.lastKnownLocation ?? selectedVehicle.location],
                ['Kilométrage', `${selectedVehicle.mileageKm.toLocaleString('fr-FR')} km`],
                ['Assurance', selectedVehicle.insuranceExpiresAt],
                ['Prochain service', `${selectedVehicle.maintenance.nextServiceAtKm.toLocaleString('fr-FR')} km`],
                ['Entretien', maintenanceLabel[selectedVehicle.maintenance.status]],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2">
                  <span className="text-content-muted">{label}</span>
                  <span className="text-right font-black text-content-primary">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-surface-border-subtle p-3">
              <p className="text-xs font-bold uppercase text-content-muted">Décision dispatch</p>
              <p className="mt-1 text-sm font-bold text-content-primary">{vehicleHealth(selectedVehicle).detail}</p>
              <p className="mt-1 text-xs text-content-muted">{selectedVehicle.maintenance.notes || 'Aucune note entretien.'}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => openEditForm(selectedVehicle)} className="rounded-xl border border-surface-border-subtle px-3 py-2 text-sm font-black text-content-primary hover:bg-surface-muted">Modifier</button>
              {selectedVehicle.status === 'cancelled' ? (
                <button type="button" onClick={() => activateVehicle(selectedVehicle.id)} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-black text-white hover:bg-green-700">Réactiver</button>
              ) : (
                <button type="button" onClick={() => disableVehicle(selectedVehicle.id)} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white hover:bg-red-700">Désactiver</button>
              )}
            </div>
          </aside>
        )}
      </section>
    </div>
  );
};
