import React, { useState, useMemo } from 'react';
import { Icon } from '../../components/Icon';
import { logisticsCard } from './logistics-ui';
import { AddDriverModal } from '../../components/logistics/AddDriverModal';
import { EditDriverModal } from '../../components/logistics/EditDriverModal';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehiclePlate: string;
  commune: string;
  email: string;
  notes: string;
  status: string;
  missionsCompleted: number;
  rating: number;
  availability: string;
}

const MOCK_DRIVERS: Driver[] = [
  { id: 'D-001', name: 'Kabongo Mutombo', phone: '+243 812 345 001', vehicle: 'Moto', vehiclePlate: 'CD-1234-KIN', commune: 'Gombe', email: 'kabongo.m@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 234, rating: 4.8, availability: 'Libre' },
  { id: 'D-002', name: 'Tshimanga Amisi', phone: '+243 812 345 002', vehicle: 'Moto', vehiclePlate: 'CD-5678-KIN', commune: 'Lingwala', email: 'tshimanga.a@mail.cd', notes: 'Vétéran du réseau', status: 'Occupé', missionsCompleted: 187, rating: 4.5, availability: '2 missions' },
  { id: 'D-003', name: 'Mutombo Patrick', phone: '+243 812 345 003', vehicle: 'Voiture', vehiclePlate: 'CD-9012-KIN', commune: 'Barumbu', email: '', notes: '', status: 'Disponible', missionsCompleted: 312, rating: 4.9, availability: 'Libre' },
  { id: 'D-004', name: 'Kalonji Samy', phone: '+243 812 345 004', vehicle: 'Voiture', vehiclePlate: 'CD-3456-KIN', commune: 'Kinshasa', email: 'kalonji.s@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 156, rating: 4.3, availability: 'Libre' },
  { id: 'D-005', name: 'Ngoy Lubobo', phone: '+243 812 345 005', vehicle: 'Moto', vehiclePlate: 'CD-7890-KIN', commune: 'Ngiri-Ngiri', email: '', notes: 'Rapide, fiable', status: 'Pause', missionsCompleted: 198, rating: 4.6, availability: 'Libre' },
  { id: 'D-006', name: 'Ilunga Bosco', phone: '+243 812 345 006', vehicle: 'Camionnette', vehiclePlate: 'CD-2345-KIN', commune: 'Bandalungwa', email: 'ilunga.b@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 89, rating: 4.2, availability: 'Libre' },
  { id: 'D-007', name: 'Kasongo Robert', phone: '+243 812 345 007', vehicle: 'Moto', vehiclePlate: 'CD-6789-KIN', commune: 'Kalamu', email: '', notes: '', status: 'Occupé', missionsCompleted: 267, rating: 4.7, availability: '1 mission' },
  { id: 'D-008', name: 'Mbuyi Tshilomba', phone: '+243 812 345 008', vehicle: 'Moto', vehiclePlate: 'CD-0123-KIN', commune: 'Matete', email: 'mbuyi.t@mail.cd', notes: 'À surveiller - retard fréquent', status: 'Hors ligne', missionsCompleted: 45, rating: 3.8, availability: 'Libre' },
  { id: 'D-009', name: 'Kanda Fulbert', phone: '+243 812 345 009', vehicle: 'Voiture', vehiclePlate: 'CD-4567-KIN', commune: 'Kimbanseke', email: '', notes: '', status: 'Disponible', missionsCompleted: 178, rating: 4.4, availability: 'Libre' },
  { id: 'D-010', name: 'Mukendi Jean', phone: '+243 812 345 010', vehicle: 'Moto', vehiclePlate: 'CD-8901-KIN', commune: 'Masina', email: 'mukendi.j@mail.cd', notes: '', status: 'Disponible', missionsCompleted: 112, rating: 4.1, availability: 'Libre' },
  { id: 'D-011', name: 'Kapenda Nsunga', phone: '+243 812 345 011', vehicle: 'Moto', vehiclePlate: 'CD-2346-KIN', commune: 'Limete', email: '', notes: 'Nouveau chauffeur', status: 'Occupé', missionsCompleted: 34, rating: 4.0, availability: '1 mission' },
  { id: 'D-012', name: 'Kalala Chantal', phone: '+243 812 345 012', vehicle: 'Camionnette', vehiclePlate: 'CD-6780-KIN', commune: 'Ngaliema', email: 'kalala.c@mail.cd', notes: '', status: 'Suspendu', missionsCompleted: 67, rating: 3.5, availability: 'Libre' },
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

export const LogisticsDrivers: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const stats = useMemo(() => ({
    total: drivers.length,
    disponibles: drivers.filter(d => d.status === 'Disponible').length,
    occupes: drivers.filter(d => d.status === 'Occupé').length,
    horsLigne: drivers.filter(d => d.status === 'Hors ligne' || d.status === 'Suspendu').length,
  }), [drivers]);

  const filteredDrivers = useMemo(() => {
    let result = drivers;
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
  }, [drivers, activeFilter, searchQuery]);

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const getAvatarColor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

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
  };

  const handleReactivate = (driverId: string) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'Disponible' } : d));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-primary">Gestion des chauffeurs</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} chauffeurs enregistrés</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 flex items-center gap-2"
        >
          <Icon name="plus" className="w-4 h-4" />
          Ajouter un chauffeur
        </button>
      </div>

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
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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

        <div className="overflow-x-auto">
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
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-sm font-bold`}>
                        {getInitials(driver.name)}
                      </div>
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
                        <button className="p-1.5 text-brand-blue hover:bg-blue-50 rounded-lg transition-colors" title="Voir profil">
                          <Icon name="user" className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Contacter">
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
