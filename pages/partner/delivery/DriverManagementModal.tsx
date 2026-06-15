import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { PartnerDeliveryDriver } from '../../../types';
import {
  partnerBtnGhost,
  partnerBtnSecondary,
  partnerField,
  partnerLabel,
  partnerModalPanel,
  partnerModalSubtitle,
  partnerModalTitle,
  partnerStatusActif,
  partnerStatusInactif,
  partnerStatusTournee,
} from '../partner-ui';

interface DriverManagementModalProps {
  isOpen: boolean;
  drivers: PartnerDeliveryDriver[];
  communes: string[];
  activeOrdersByDriver: Record<string, number>;
  onClose: () => void;
  onSave: (drivers: PartnerDeliveryDriver[]) => void;
}

type FormMode = { type: 'add' } | { type: 'edit'; driverId: string };

const emptyForm = {
  name: '',
  phone: '',
  state: 'Actif' as PartnerDeliveryDriver['state'],
  zones: [] as string[],
  avgTime: '35 min',
};

const statusClass = (state: PartnerDeliveryDriver['state']) => {
  if (state === 'Actif') return partnerStatusActif;
  if (state === 'En tournee') return partnerStatusTournee;
  return partnerStatusInactif;
};

export const DriverManagementModal: React.FC<DriverManagementModalProps> = ({
  isOpen,
  drivers,
  communes,
  activeOrdersByDriver,
  onClose,
  onSave,
}) => {
  const [localDrivers, setLocalDrivers] = useState<PartnerDeliveryDriver[]>(drivers);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalDrivers(drivers);
      setFormMode(null);
      setSearch('');
    }
  }, [isOpen, drivers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return localDrivers;
    const q = search.toLowerCase();
    return localDrivers.filter(
      (d) => d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.zones.some((z) => z.toLowerCase().includes(q)),
    );
  }, [localDrivers, search]);

  if (!isOpen) return null;

  const openAdd = () => {
    setForm({ ...emptyForm, zones: communes.slice(0, 2) });
    setFormMode({ type: 'add' });
  };

  const openEdit = (driver: PartnerDeliveryDriver) => {
    setForm({
      name: driver.name,
      phone: driver.phone,
      state: driver.state,
      zones: [...driver.zones],
      avgTime: driver.avgTime,
    });
    setFormMode({ type: 'edit', driverId: driver.id });
  };

  const toggleZone = (zone: string) => {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone) ? prev.zones.filter((z) => z !== zone) : [...prev.zones, zone],
    }));
  };

  const toggleDriverState = (driverId: string) => {
    setLocalDrivers((prev) =>
      prev.map((d) => {
        if (d.id !== driverId) return d;
        const next: PartnerDeliveryDriver['state'] =
          d.state === 'Actif' ? 'Inactif' : d.state === 'Inactif' ? 'Actif' : 'Actif';
        return { ...d, state: next, remaining: next === 'Actif' ? 'Disponible' : '0' };
      }),
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || form.zones.length === 0) return;

    if (formMode?.type === 'add') {
      const created: PartnerDeliveryDriver = {
        id: `drv-${Date.now()}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        state: form.state,
        zones: form.zones,
        total: 0,
        avgTime: form.avgTime,
        rating: 5,
        success: 100,
        remaining: form.state === 'Actif' ? 'Disponible' : '0',
      };
      setLocalDrivers((prev) => [...prev, created]);
    } else if (formMode?.type === 'edit') {
      setLocalDrivers((prev) =>
        prev.map((d) =>
          d.id === formMode.driverId
            ? {
                ...d,
                name: form.name.trim(),
                phone: form.phone.trim(),
                state: form.state,
                zones: form.zones,
                avgTime: form.avgTime,
                remaining: form.state === 'Inactif' ? '0' : d.remaining || 'Disponible',
              }
            : d,
        ),
      );
    }
    setFormMode(null);
  };

  const handleDelete = (driverId: string) => {
    const active = activeOrdersByDriver[localDrivers.find((d) => d.id === driverId)?.name || ''] || 0;
    if (active > 0) return;
    setLocalDrivers((prev) => prev.filter((d) => d.id !== driverId));
  };

  const handleSaveAll = () => {
    onSave(localDrivers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className={`${partnerModalPanel} max-w-2xl`}>
        <div className="flex items-start justify-between border-b border-surface-border-subtle p-5">
          <div>
            <h2 className={partnerModalTitle}>Gerer mes livreurs</h2>
            <p className={partnerModalSubtitle}>
              {localDrivers.filter((d) => d.state !== 'Inactif').length} actifs sur {localDrivers.length} livreurs
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-content-muted hover:text-content-primary">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {formMode ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-content-primary">
                {formMode.type === 'add' ? 'Ajouter un livreur' : 'Modifier le livreur'}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={partnerLabel}>Nom *</label>
                  <input className={partnerField} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jean L." required />
                </div>
                <div>
                  <label className={partnerLabel}>Telephone *</label>
                  <input className={partnerField} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+243 84 000 00 00" required />
                </div>
                <div>
                  <label className={partnerLabel}>Statut</label>
                  <select className={partnerField} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value as PartnerDeliveryDriver['state'] })}>
                    <option value="Actif">Actif</option>
                    <option value="En tournee">En tournee</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
                <div>
                  <label className={partnerLabel}>Temps moyen</label>
                  <input className={partnerField} value={form.avgTime} onChange={(e) => setForm({ ...form, avgTime: e.target.value })} placeholder="35 min" />
                </div>
              </div>
              <div>
                <label className={partnerLabel}>Zones couvertes *</label>
                <div className="flex flex-wrap gap-2">
                  {communes.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => toggleZone(zone)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        form.zones.includes(zone)
                          ? 'bg-brand-blue text-white'
                          : 'border border-surface-border bg-surface-muted text-content-muted hover:text-content-primary'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setFormMode(null)} className={partnerBtnGhost}>
                  Annuler
                </button>
                <button type="submit" className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700">
                  {formMode.type === 'add' ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <input className={partnerField} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un livreur…" />
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <p className="py-8 text-center text-sm text-content-muted">Aucun livreur trouve.</p>
                ) : (
                  filtered.map((d) => {
                    const activeOrders = activeOrdersByDriver[d.name] || 0;
                    return (
                      <div
                        key={d.id}
                        className="flex flex-col gap-3 rounded-xl border border-surface-border-subtle bg-surface-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-sm font-bold text-brand-blue">
                            {d.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-content-primary">{d.name}</p>
                              <span className={statusClass(d.state)}>{d.state}</span>
                            </div>
                            <p className="text-xs text-content-muted">{d.phone}</p>
                            <p className="truncate text-[11px] text-content-muted">
                              {d.zones.join(', ')} • {activeOrders} cmd en cours • {d.rating}/5
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button type="button" onClick={() => toggleDriverState(d.id)} className={partnerBtnSecondary}>
                            {d.state === 'Inactif' ? 'Activer' : 'Desactiver'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(d)}
                            className="rounded-lg border border-brand-blue/40 bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue/20"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            disabled={activeOrders > 0}
                            title={activeOrders > 0 ? 'Livreur avec commandes en cours' : 'Supprimer'}
                            className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-40"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {!formMode && (
          <div className="flex justify-end gap-2 border-t border-surface-border-subtle p-5">
            <button type="button" onClick={onClose} className={partnerBtnGhost}>
              Annuler
            </button>
            <button type="button" onClick={handleSaveAll} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700">
              Enregistrer les modifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
