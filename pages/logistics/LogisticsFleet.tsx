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

const DRIVERS = ['Kabongo M.', 'Tshimanga A.', 'Mutombo P.', 'Kalonji S.', 'Ngoy L.'];

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
    maintenance: {
      status: 'ok',
      nextServiceAtKm: 20000,
      notes: 'RAS',
    },
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
    maintenance: {
      status: 'scheduled',
      nextServiceAtKm: 45000,
      notes: 'Vidange planifiée',
    },
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
    maintenance: {
      status: 'in_progress',
      nextServiceAtKm: 30000,
      notes: 'Freinage en contrôle',
    },
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
    maintenance: {
      status: 'overdue',
      nextServiceAtKm: 55000,
      notes: 'Assurance et contrôle à renouveler',
    },
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

const toVehicle = (form: VehicleForm, id: string): Vehicle => ({
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
    status: form.maintenanceStatus,
    nextServiceAtKm: (Number(form.mileageKm) || 0) + 2500,
    notes: form.maintenanceNotes,
  },
});

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
  const [form, setForm] = useState<VehicleForm>(emptyForm);

  const kpis = useMemo(() => {
    const inMaintenance = vehicles.filter((vehicle) =>
      vehicle.maintenance.status === 'in_progress' || vehicle.maintenance.status === 'overdue'
    ).length;
    return {
      total: vehicles.length,
      active: vehicles.filter((vehicle) => vehicle.status === 'in_transit' || vehicle.status === 'assigned').length,
      maintenance: inMaintenance,
      unavailable: vehicles.filter((vehicle) => vehicle.status === 'failed' || vehicle.status === 'cancelled').length,
    };
  }, [vehicles]);

  useEffect(() => {
    let mounted = true;
    getVehicles(initialVehicles).then((result) => {
      if (!mounted) return;
      setVehicles(result.data);
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
  };

  const openEditForm = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setForm(toForm(vehicle));
    setIsFormOpen(true);
  };

  const saveVehicle = () => {
    if (!form.plate.trim()) return;
    if (editingVehicleId) {
      setVehicles((current) =>
        current.map((vehicle) => (vehicle.id === editingVehicleId ? toVehicle(form, editingVehicleId) : vehicle))
      );
    } else {
      setVehicles((current) => [toVehicle(form, `veh-${String(current.length + 1).padStart(3, '0')}`), ...current]);
    }
    setIsFormOpen(false);
    setEditingVehicleId(null);
    setForm(emptyForm);
  };

  const disableVehicle = (vehicleId: string) => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, status: 'cancelled', assignedDriverName: undefined, driverId: undefined } : vehicle
      )
    );
  };

  const assignDriver = (vehicleId: string, driverName: string) => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === vehicleId
          ? {
              ...vehicle,
              status: vehicle.status === 'cancelled' ? 'assigned' : vehicle.status,
              assignedDriverName: driverName,
              driverId: `drv-${driverName.toLowerCase().replace(/[^a-z]/g, '-')}`,
            }
          : vehicle
      )
    );
    setAssigningVehicleId(null);
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        dataMode === 'backend'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }`}>
        {dataMode === 'backend' ? 'Données véhicules connectées au backend' : 'Mode dégradé — données véhicules locales'}
      </div>

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

      <section className={`${logisticsCard} overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b border-surface-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700"
          >
            <Icon name="plus" className="h-4 w-4" />
            Ajouter véhicule
          </button>
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
                <input
                  value={form.zone}
                  onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-sm text-content-primary"
                />
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

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
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
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-5 py-4 font-black text-content-primary">{vehicle.plate}</td>
                  <td className="px-5 py-4 text-content-muted">{typeLabel[vehicle.type]}</td>
                  <td className="px-5 py-4 text-content-muted">{vehicle.assignedDriverName ?? 'Non assigné'}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-brand-blue/10 px-2 py-1 text-xs font-bold text-brand-blue">
                      {statusLabel[vehicle.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-content-muted">{vehicle.location}</td>
                  <td className="px-5 py-4 text-content-muted">{vehicle.mileageKm.toLocaleString('fr-FR')} km</td>
                  <td className="px-5 py-4 text-content-muted">{vehicle.insuranceExpiresAt}</td>
                  <td className="px-5 py-4 text-content-muted">{maintenanceLabel[vehicle.maintenance.status]}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(vehicle)}
                        className="rounded-lg border border-surface-border-subtle px-2 py-1 text-xs font-bold text-content-muted hover:bg-surface-muted"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssigningVehicleId(assigningVehicleId === vehicle.id ? null : vehicle.id)}
                        className="rounded-lg border border-surface-border-subtle px-2 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue/10"
                      >
                        Assigner
                      </button>
                      <button
                        type="button"
                        onClick={() => disableVehicle(vehicle.id)}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Désactiver
                      </button>
                    </div>
                    {assigningVehicleId === vehicle.id && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {DRIVERS.map((driver) => (
                          <button
                            key={driver}
                            type="button"
                            onClick={() => assignDriver(vehicle.id, driver)}
                            className="rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-content-primary hover:bg-brand-blue/10"
                          >
                            {driver}
                          </button>
                        ))}
                      </div>
                    )}
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
