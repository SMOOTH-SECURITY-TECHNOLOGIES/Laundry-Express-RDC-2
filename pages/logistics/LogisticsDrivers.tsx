import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { logisticsCard } from './logistics-ui';
import { AddDriverModal } from '../../components/logistics/AddDriverModal';
import { EditDriverModal } from '../../components/logistics/EditDriverModal';
import { getLogisticsDrivers, type DataMode, type LogisticsDriverProfile } from '../../services/logistics-api';

type Driver = LogisticsDriverProfile;

const MOCK_DRIVERS: Driver[] = [
  { id: 'D-001', name: 'Kabongo Mutombo', phone: '+243 812 345 001', avatarUrl: '/images/drivers/driver-1.svg', vehicle: 'Moto', vehiclePlate: 'CD-1234-KIN', commune: 'Gombe', email: 'kabongo.m@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 234, rating: 4.8, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }, { label: 'Carte véhicule', status: 'valid' }], performance: { punctuality: 96, delays: 3, cancellations: 1, revenue: 12450 } },
  { id: 'D-002', name: 'Tshimanga Amisi', phone: '+243 812 345 002', avatarUrl: '/images/drivers/driver-2.svg', vehicle: 'Moto', vehiclePlate: 'CD-5678-KIN', commune: 'Lingwala', email: 'tshimanga.a@mail.cd', notes: 'Vétéran du réseau', status: 'Occupé', missionsCompleted: 187, rating: 4.5, availability: '2 missions', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }, { label: 'Carte véhicule', status: 'valid' }], performance: { punctuality: 91, delays: 8, cancellations: 2, revenue: 9800 } },
  { id: 'D-003', name: 'Mutombo Patrick', phone: '+243 812 345 003', avatarUrl: '/images/drivers/driver-3.svg', vehicle: 'Voiture', vehiclePlate: 'CD-9012-KIN', commune: 'Barumbu', email: '', notes: '', status: 'Disponible', missionsCompleted: 312, rating: 4.9, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }, { label: 'Carte véhicule', status: 'valid' }], performance: { punctuality: 98, delays: 2, cancellations: 0, revenue: 16800 } },
  { id: 'D-004', name: 'Kalonji Samy', phone: '+243 812 345 004', vehicle: 'Voiture', vehiclePlate: 'CD-3456-KIN', commune: 'Kinshasa', email: 'kalonji.s@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 156, rating: 4.3, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'expired' }, { label: 'Carte véhicule', status: 'valid' }], performance: { punctuality: 88, delays: 11, cancellations: 3, revenue: 7450 } },
  { id: 'D-005', name: 'Ngoy Lubobo', phone: '+243 812 345 005', vehicle: 'Moto', vehiclePlate: 'CD-7890-KIN', commune: 'Ngiri-Ngiri', email: '', notes: 'Rapide, fiable', status: 'Pause', missionsCompleted: 198, rating: 4.6, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }, { label: 'Carte véhicule', status: 'missing' }], performance: { punctuality: 93, delays: 5, cancellations: 1, revenue: 10200 } },
  { id: 'D-006', name: 'Ilunga Bosco', phone: '+243 812 345 006', vehicle: 'Camionnette', vehiclePlate: 'CD-2345-KIN', commune: 'Bandalungwa', email: 'ilunga.b@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 89, rating: 4.2, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }], performance: { punctuality: 90, delays: 6, cancellations: 2, revenue: 6200 } },
  { id: 'D-007', name: 'Kasongo Robert', phone: '+243 812 345 007', vehicle: 'Moto', vehiclePlate: 'CD-6789-KIN', commune: 'Kalamu', email: '', notes: '', status: 'Occupé', missionsCompleted: 267, rating: 4.7, availability: '1 mission', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }], performance: { punctuality: 94, delays: 4, cancellations: 1, revenue: 13200 } },
  { id: 'D-008', name: 'Mbuyi Tshilomba', phone: '+243 812 345 008', vehicle: 'Moto', vehiclePlate: 'CD-0123-KIN', commune: 'Matete', email: 'mbuyi.t@mail.cd', notes: 'À surveiller - retard fréquent', status: 'Hors ligne', missionsCompleted: 45, rating: 3.8, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'expired' }], performance: { punctuality: 71, delays: 18, cancellations: 6, revenue: 2800 } },
  { id: 'D-009', name: 'Kanda Fulbert', phone: '+243 812 345 009', vehicle: 'Voiture', vehiclePlate: 'CD-4567-KIN', commune: 'Kimbanseke', email: '', notes: '', status: 'Disponible', missionsCompleted: 178, rating: 4.4, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }], performance: { punctuality: 89, delays: 9, cancellations: 2, revenue: 8300 } },
  { id: 'D-010', name: 'Mukendi Jean', phone: '+243 812 345 010', vehicle: 'Moto', vehiclePlate: 'CD-8901-KIN', commune: 'Masina', email: 'mukendi.j@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 112, rating: 4.1, availability: 'Libre', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }], performance: { punctuality: 86, delays: 10, cancellations: 4, revenue: 5100 } },
  { id: 'D-011', name: 'Kapenda Nsunga', phone: '+243 812 345 011', vehicle: 'Moto', vehiclePlate: 'CD-2346-KIN', commune: 'Limete', email: '', notes: 'Nouveau chauffeur', status: 'Occupé', missionsCompleted: 34, rating: 4.0, availability: '1 mission', documents: [{ label: 'Permis', status: 'valid' }, { label: 'Assurance', status: 'valid' }], performance: { punctuality: 84, delays: 7, cancellations: 2, revenue: 1900 } },
  { id: 'D-012', name: 'Kalala Chantal', phone: '+243 812 345 012', vehicle: 'Camionnette', vehiclePlate: 'CD-6780-KIN', commune: 'Ngaliema', email: 'kalala.c@mail.cd', notes: '', status: 'Suspendu', missionsCompleted: 67, rating: 3.5, availability: 'Libre', documents: [{ label: 'Permis', status: 'expired' }, { label: 'Assurance', status: 'missing' }], performance: { punctuality: 68, delays: 16, cancellations: 8, revenue: 2400 } },
];

const STATUS_STYLES: Record<string, string> = {
  'Disponible': 'bg-green-100 text-green-700',
  'Occupé': 'bg-orange-100 text-orange-700',
  'Pause': 'bg-yellow-100 text-yellow-700',
  'Hors ligne': 'bg-gray-100 text-gray-500',
  'Suspendu': 'bg-red-100 text-red-700',
};

const FILTER_TABS = [
  { key: 'Tous', label: 'Tous' },
  { key: 'Disponible', label: 'Disponible' },
  { key: 'Occupé', label: 'Occupé' },
  { key: 'Pause', label: 'Pause' },
  { key: 'Hors ligne', label: 'Hors ligne' },
  { key: 'Suspendu', label: 'Suspendu' },
];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500',
  'bg-teal-500', 'bg-indigo-500', 'bg-red-500', 'bg-cyan-500', 'bg-amber-500',
];

const DOCUMENT_STYLES: Record<NonNullable<Driver['documents']>[number]['status'], string> = {
  valid: 'bg-green-100 text-green-700',
  expired: 'bg-orange-100 text-orange-700',
  missing: 'bg-red-100 text-red-700',
};

const DOCUMENT_LABELS: Record<NonNullable<Driver['documents']>[number]['status'], string> = {
  valid: 'Valide',
  expired: 'Expiré',
  missing: 'Manquant',
};

interface LogisticsDriversProps {
  focusDriverName?: string | null;
  onClearFocus?: () => void;
}

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const LogisticsDrivers: React.FC<LogisticsDriversProps> = ({ focusDriverName, onClearFocus }) => {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('D-001');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    getLogisticsDrivers(MOCK_DRIVERS).then((result) => {
      if (!mounted) return;
      setDrivers(result.data);
      setSelectedDriverId(result.data[0]?.id ?? '');
      setDataMode(result.mode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedDriverId) {
      profileRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDriverId]);

  const stats = useMemo(() => ({
    total: drivers.length,
    disponibles: drivers.filter(d => d.status === 'Disponible').length,
    occupes: drivers.filter(d => d.status === 'Occupé').length,
    horsLigne: drivers.filter(d => d.status === 'Hors ligne' || d.status === 'Suspendu').length,
  }), [drivers]);

  const filteredDrivers = useMemo(() => {
    let result = drivers;
    if (focusDriverName) {
      const focus = normalize(focusDriverName.replace(/\.$/, ''));
      result = result.filter(d => {
        const fullName = normalize(d.name);
        return fullName.includes(focus) || focus.split(/\s+/).every(part => fullName.includes(part));
      });
      return result;
    }
    if (activeFilter !== 'Tous') {
      result = result.filter(d => d.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.phone.toLowerCase().includes(q) ||
          d.commune.toLowerCase().includes(q) ||
          d.vehicle.toLowerCase().includes(q)
      );
    }
    return result;
  }, [drivers, activeFilter, searchQuery, focusDriverName]);

  const selectedDriver = useMemo(() => {
    if (focusDriverName && filteredDrivers[0]) return filteredDrivers[0];
    return drivers.find(d => d.id === selectedDriverId) ?? filteredDrivers[0] ?? drivers[0];
  }, [drivers, filteredDrivers, focusDriverName, selectedDriverId]);

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const getAvatarColor = (index: number) => AVATAR_COLORS[Math.max(0, index) % AVATAR_COLORS.length];

  const renderAvatar = (driver: Driver, index: number, className = 'h-10 w-10', textClassName = 'text-sm') =>
    driver.avatarUrl ? (
      <img
        src={driver.avatarUrl}
        alt={`Photo de ${driver.name}`}
        className={`${className} shrink-0 rounded-full object-cover ring-1 ring-surface-border-subtle`}
      />
    ) : (
      <div className={`${className} ${getAvatarColor(index)} flex shrink-0 items-center justify-center rounded-full ${textClassName} font-bold text-white`}>
        {getInitials(driver.name)}
      </div>
    );

  const getFilterCount = (filter: string) => {
    if (filter === 'Tous') return drivers.length;
    return drivers.filter(d => d.status === filter).length;
  };

  const handleAddDriver = (newDriver: Omit<Driver, 'id' | 'missionsCompleted' | 'rating'>) => {
    const driver: Driver = {
      ...newDriver,
      id: `D-${String(drivers.length + 1).padStart(3, '0')}`,
      missionsCompleted: 0,
      rating: 5.0,
    };
    setDrivers(prev => [...prev, driver]);
    setShowAddModal(false);
  };

  const handleEditDriver = (updated: Driver) => {
    setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
    setEditingDriver(null);
  };

  const handleSuspend = (driverId: string) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'Suspendu' } : d));
    setActionMessage('Chauffeur suspendu');
  };

  const handleReactivate = (driverId: string) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'Disponible' } : d));
    setActionMessage('Chauffeur réactivé');
  };

  const handleAssignMission = (driver: Driver) => {
    setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'Occupé', availability: '1 mission' } : d));
    setActionMessage(`Mission assignée à ${driver.name}`);
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        dataMode === 'backend'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }`}>
        {dataMode === 'backend' ? 'Chauffeurs connectés au backend' : 'Mode dégradé — chauffeurs locaux'}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-primary">Gestion des chauffeurs</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} chauffeurs enregistrés</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white hover:bg-brand-blue/90 sm:w-auto sm:py-2.5"
        >
          <Icon name="plus" className="w-4 h-4" />
          Ajouter un chauffeur
        </button>
      </div>

      {focusDriverName && (
        <div className="rounded-2xl border border-green-400/60 bg-green-500/10 p-4 text-sm text-content-primary">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold">Chauffeur ciblé depuis l’alerte: {focusDriverName}</p>
              <p className="mt-1 text-content-muted">
                {filteredDrivers.length > 0
                  ? 'La liste est filtrée sur le chauffeur à contacter.'
                  : 'Aucun chauffeur correspondant trouvé dans les données actuelles.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('logisticsFocusDriverName');
                onClearFocus?.();
              }}
              className="self-start rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-bold text-content-primary hover:bg-surface-muted sm:self-center"
            >
              Voir tous les chauffeurs
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: 'users' as const, tone: 'bg-blue-50 text-brand-blue' },
          { label: 'Disponibles', value: stats.disponibles, icon: 'check' as const, tone: 'bg-green-50 text-green-600' },
          { label: 'Occupés', value: stats.occupes, icon: 'truck' as const, tone: 'bg-orange-50 text-orange-600' },
          { label: 'Hors ligne', value: stats.horsLigne, icon: 'xmark' as const, tone: 'bg-gray-100 text-gray-500' },
        ].map(kpi => (
          <div key={kpi.label} className={`${logisticsCard} p-4`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${kpi.tone}`}>
                <Icon name={kpi.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="text-xl font-extrabold text-content-primary">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${logisticsCard} overflow-hidden`}>
        <div className="border-b border-gray-100 p-4 sm:p-6">
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`shrink-0 rounded-full px-4 py-3 text-sm font-medium transition-colors sm:py-2 ${
                  activeFilter === tab.key
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {getFilterCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, commune ou véhicule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {filteredDrivers.length === 0 ? (
            <div className="py-10 text-center">
              <Icon name="users" className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Aucun chauffeur trouvé</p>
            </div>
          ) : (
            filteredDrivers.map((driver, index) => (
              <article key={driver.id} className="rounded-2xl border border-surface-border-subtle bg-surface-card p-4">
                <div className="flex items-start gap-3">
                  {renderAvatar(driver, index, 'h-11 w-11')}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-content-primary">{driver.name}</p>
                        <p className="mt-0.5 text-xs text-content-muted">{driver.phone}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${STATUS_STYLES[driver.status] || 'bg-gray-100 text-gray-700'}`}>
                        {driver.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-surface-muted p-2">
                        <p className="text-content-muted">Véhicule</p>
                        <p className="mt-1 font-bold text-content-primary">{driver.vehicle}</p>
                      </div>
                      <div className="rounded-xl bg-surface-muted p-2">
                        <p className="text-content-muted">Zone</p>
                        <p className="mt-1 font-bold text-content-primary">{driver.commune}</p>
                      </div>
                      <div className="rounded-xl bg-surface-muted p-2">
                        <p className="text-content-muted">Missions</p>
                        <p className="mt-1 font-bold text-content-primary">{driver.missionsCompleted}</p>
                      </div>
                      <div className="rounded-xl bg-surface-muted p-2">
                        <p className="text-content-muted">Note</p>
                        <p className="mt-1 font-bold text-content-primary">{driver.rating.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDriverId(driver.id)}
                        className="rounded-xl bg-brand-blue px-2 py-3 text-xs font-black text-white"
                      >
                        Profil
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDriverId(driver.id);
                          setActionMessage(`Appel chauffeur: ${driver.phone}`);
                        }}
                        className="rounded-xl border border-green-200 px-2 py-3 text-xs font-black text-green-600"
                      >
                        Appel
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDriver(driver)}
                        className="rounded-xl border border-orange-200 px-2 py-3 text-xs font-black text-brand-orange"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => (driver.status === 'Suspendu' ? handleReactivate(driver.id) : handleSuspend(driver.id))}
                        className="rounded-xl border border-red-200 px-2 py-3 text-xs font-black text-red-600"
                      >
                        {driver.status === 'Suspendu' ? 'Actif' : 'Stop'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Véhicule</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Disponibilité</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Missions</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <Icon name="users" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">Aucun chauffeur trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver, index) => (
                  <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {renderAvatar(driver, index)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{driver.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{driver.phone}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{driver.vehicle}</div>
                      <div className="text-xs text-gray-400">{driver.vehiclePlate}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{driver.availability}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{driver.missionsCompleted}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Icon name="star" className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-gray-700">{driver.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[driver.status] || 'bg-gray-100 text-gray-700'}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDriverId(driver.id)}
                          className="p-1.5 text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir profil"
                        >
                          <Icon name="user" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDriverId(driver.id);
                            setActionMessage(`Appel chauffeur: ${driver.phone}`);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Contacter"
                        >
                          <Icon name="phone" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDriver(driver)}
                          className="p-1.5 text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Icon name="pencil" className="w-4 h-4" />
                        </button>
                        {driver.status === 'Suspendu' ? (
                          <button
                            onClick={() => handleReactivate(driver.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Réactiver"
                          >
                            <Icon name="check" className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(driver.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Suspendre"
                          >
                            <Icon name="xmark" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDriver && (
        <section ref={profileRef} className={`${logisticsCard} p-4 sm:p-6 scroll-mt-24`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-4">
                {renderAvatar(selectedDriver, drivers.findIndex(driver => driver.id === selectedDriver.id), 'h-14 w-14', 'text-lg')}
                <div>
                  <h2 className="text-xl font-black text-content-primary">Profil chauffeur</h2>
                  <p className="mt-1 text-lg font-extrabold text-content-primary">{selectedDriver.name}</p>
                  <p className="text-sm text-content-muted">{selectedDriver.phone} · {selectedDriver.commune}</p>
                </div>
              </div>
              {actionMessage && (
                <p className="mt-4 rounded-xl bg-brand-blue/10 px-3 py-2 text-sm font-bold text-brand-blue">
                  {actionMessage}
                </p>
              )}
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setActionMessage(`Appel chauffeur: ${selectedDriver.phone}`)}
                className="rounded-xl bg-brand-blue px-3 py-3 text-xs font-black text-white sm:py-2"
              >
                Appeler
              </button>
              <button
                type="button"
                onClick={() => setActionMessage(`Message envoyé à ${selectedDriver.name}`)}
                className="rounded-xl border border-surface-border-subtle px-3 py-3 text-xs font-black text-content-primary hover:bg-surface-muted sm:py-2"
              >
                Message
              </button>
              {selectedDriver.status === 'Suspendu' ? (
                <button
                  type="button"
                  onClick={() => handleReactivate(selectedDriver.id)}
                  className="rounded-xl border border-green-200 px-3 py-3 text-xs font-black text-green-600 hover:bg-green-50 sm:py-2"
                >
                  Réactiver
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSuspend(selectedDriver.id)}
                  className="rounded-xl border border-red-200 px-3 py-3 text-xs font-black text-red-600 hover:bg-red-50 sm:py-2"
                >
                  Suspendre
                </button>
              )}
              <button
                type="button"
                onClick={() => handleAssignMission(selectedDriver)}
                className="col-span-2 rounded-xl border border-surface-border-subtle px-3 py-3 text-xs font-black text-content-primary hover:bg-surface-muted sm:col-span-1 sm:py-2"
              >
                Assigner mission
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <h3 className="text-sm font-black text-content-primary">Infos</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-content-muted">Véhicule</dt><dd className="font-bold text-content-primary">{selectedDriver.vehicle}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-content-muted">Plaque</dt><dd className="font-bold text-content-primary">{selectedDriver.vehiclePlate}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-content-muted">Zone</dt><dd className="font-bold text-content-primary">{selectedDriver.commune}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-content-muted">Statut</dt><dd className="font-bold text-content-primary">{selectedDriver.status}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-content-muted">Note</dt><dd className="font-bold text-content-primary">{selectedDriver.rating.toFixed(1)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-content-muted">Missions terminées</dt><dd className="font-bold text-content-primary">{selectedDriver.missionsCompleted}</dd></div>
              </dl>
            </div>

            <div className="rounded-xl bg-surface-muted p-4">
              <h3 className="text-sm font-black text-content-primary">Documents</h3>
              <div className="mt-3 space-y-2">
                {(selectedDriver.documents ?? []).map(doc => (
                  <div key={doc.label} className="flex items-center justify-between rounded-lg bg-surface-card px-3 py-2 text-sm">
                    <span className="font-bold text-content-primary">{doc.label}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${DOCUMENT_STYLES[doc.status]}`}>
                      {DOCUMENT_LABELS[doc.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-surface-muted p-4">
              <h3 className="text-sm font-black text-content-primary">Performance</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-surface-card p-3"><dt className="text-content-muted">Ponctualité</dt><dd className="mt-1 font-black text-content-primary">{selectedDriver.performance?.punctuality ?? 0}%</dd></div>
                <div className="rounded-lg bg-surface-card p-3"><dt className="text-content-muted">Retards</dt><dd className="mt-1 font-black text-content-primary">{selectedDriver.performance?.delays ?? 0}</dd></div>
                <div className="rounded-lg bg-surface-card p-3"><dt className="text-content-muted">Annulations</dt><dd className="mt-1 font-black text-content-primary">{selectedDriver.performance?.cancellations ?? 0}</dd></div>
                <div className="rounded-lg bg-surface-card p-3"><dt className="text-content-muted">Revenus</dt><dd className="mt-1 font-black text-content-primary">{(selectedDriver.performance?.revenue ?? 0).toLocaleString('fr-FR')} $</dd></div>
              </dl>
            </div>
          </div>
        </section>
      )}

      <AddDriverModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDriver}
      />
      <EditDriverModal
        isOpen={!!editingDriver}
        driver={editingDriver}
        onClose={() => setEditingDriver(null)}
        onSave={handleEditDriver}
      />
    </div>
  );
};

export default LogisticsDrivers;
