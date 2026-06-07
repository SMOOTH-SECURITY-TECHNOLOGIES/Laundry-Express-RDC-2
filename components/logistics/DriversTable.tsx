import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehiclePlate?: string;
  status: string;
  commune: string;
  rating: number;
  missionsCompleted: number;
  occupation: number;
  avgTime: number;
}

interface DriversTableProps {
  drivers: Driver[];
  onContact: (driverId: string) => void;
  onSuspend: (driverId: string) => void;
  onReactivate: (driverId: string) => void;
  onViewProfile: (driverId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  busy: 'Occupé',
  break: 'Pause',
  offline: 'Hors ligne',
  suspended: 'Suspendu',
};

const STATUS_CLASSES: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-orange-100 text-orange-700',
  break: 'bg-yellow-100 text-yellow-700',
  offline: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-700',
};

const STATUS_FILTER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'available', label: 'Disponible' },
  { key: 'busy', label: 'Occupé' },
  { key: 'break', label: 'Pause' },
  { key: 'offline', label: 'Hors ligne' },
  { key: 'suspended', label: 'Suspendu' },
];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500',
  'bg-teal-500', 'bg-indigo-500', 'bg-red-500', 'bg-cyan-500', 'bg-amber-500',
];

const MOCK_DRIVERS: Driver[] = [
  { id: 'D-001', name: 'Mohamed Amine', phone: '+213 555 020 001', vehicle: 'Moto Honda', vehiclePlate: '16-445-AB', status: 'available', commune: 'Alger Centre', rating: 4.8, missionsCompleted: 234, occupation: 0, avgTime: 18 },
  { id: 'D-002', name: 'Amine Bouzid', phone: '+213 555 020 002', vehicle: 'Voiture Renault', vehiclePlate: '16-789-CD', status: 'busy', commune: 'Hydra', rating: 4.5, missionsCompleted: 187, occupation: 1, avgTime: 22 },
  { id: 'D-003', name: 'Youcef Hamidi', phone: '+213 555 020 003', vehicle: 'Moto Yamaha', vehiclePlate: '16-123-EF', status: 'available', commune: 'Bab El Oued', rating: 4.9, missionsCompleted: 312, occupation: 0, avgTime: 15 },
  { id: 'D-004', name: 'Karim Zeroual', phone: '+213 555 020 004', vehicle: 'Voiture Peugeot', vehiclePlate: '16-456-GH', status: 'break', commune: 'El Biar', rating: 4.3, missionsCompleted: 156, occupation: 0, avgTime: 25 },
  { id: 'D-005', name: 'Nabil Ferhat', phone: '+213 555 020 005', vehicle: 'Moto Suzuki', vehiclePlate: '16-321-IJ', status: 'offline', commune: 'Hussein Dey', rating: 4.6, missionsCompleted: 198, occupation: 0, avgTime: 20 },
  { id: 'D-006', name: 'Rachid Mebarki', phone: '+213 555 020 006', vehicle: 'Voiture Dacia', vehiclePlate: '16-654-KL', status: 'available', commune: 'Kouba', rating: 4.2, missionsCompleted: 89, occupation: 0, avgTime: 24 },
  { id: 'D-007', name: 'Samir Touati', phone: '+213 555 020 007', vehicle: 'Moto Honda', vehiclePlate: '16-987-MN', status: 'busy', commune: 'Birkhadem', rating: 4.7, missionsCompleted: 267, occupation: 2, avgTime: 17 },
  { id: 'D-008', name: 'Omar Benmalek', phone: '+213 555 020 008', vehicle: 'Voiture Toyota', vehiclePlate: '16-111-OP', status: 'suspended', commune: 'Dar El Beïda', rating: 3.8, missionsCompleted: 45, occupation: 0, avgTime: 30 },
  { id: 'D-009', name: 'Yacine Djelloul', phone: '+213 555 020 009', vehicle: 'Moto Kawasaki', vehiclePlate: '16-222-QR', status: 'available', commune: "Sidi M'Hamed", rating: 4.4, missionsCompleted: 178, occupation: 0, avgTime: 19 },
  { id: 'D-010', name: 'Mourad Cherifi', phone: '+213 555 020 010', vehicle: 'Voiture Hyundai', vehiclePlate: '16-333-ST', status: 'break', commune: 'Ben Aknoun', rating: 4.1, missionsCompleted: 112, occupation: 0, avgTime: 21 },
];

export const DriversTable: React.FC<DriversTableProps> = ({
  drivers,
  onContact,
  onSuspend,
  onReactivate,
  onViewProfile,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const getCounts = (key: string) => {
    if (key === 'all') return drivers.length;
    return drivers.filter(d => d.status === key).length;
  };

  const filteredDrivers = useMemo(() => {
    let result = drivers;

    if (activeFilter !== 'all') {
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
    name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getAvatarColor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_FILTER_TABS.map(tab => (
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
                activeFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {getCounts(tab.key)}
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
                <td colSpan={9} className="px-6 py-12 text-center">
                  <Icon name="users" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucun chauffeur trouvé</p>
                </td>
              </tr>
            ) : (
              filteredDrivers.map((driver, index) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-sm font-bold`}>
                      {getInitials(driver.name)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{driver.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{driver.phone}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{driver.vehicle}</div>
                    {driver.vehiclePlate && (
                      <div className="text-xs text-gray-400">{driver.vehiclePlate}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {driver.occupation > 0 ? (
                      <span className="text-orange-600 font-medium">{driver.occupation} mission(s)</span>
                    ) : (
                      <span className="text-green-600">Libre</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{driver.missionsCompleted}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Icon name="star" className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-gray-700">{driver.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_CLASSES[driver.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[driver.status] || driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === driver.id ? null : driver.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Icon name="bars3" className="w-4 h-4" />
                      </button>
                      {openDropdown === driver.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                          <button
                            onClick={() => { onViewProfile(driver.id); setOpenDropdown(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon name="user" className="w-4 h-4" /> Voir profil
                          </button>
                          <button
                            onClick={() => { onContact(driver.id); setOpenDropdown(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon name="phone" className="w-4 h-4" /> Contacter
                          </button>
                          {driver.status === 'suspended' ? (
                            <button
                              onClick={() => { onReactivate(driver.id); setOpenDropdown(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                            >
                              <Icon name="check" className="w-4 h-4" /> Réactiver
                            </button>
                          ) : (
                            <button
                              onClick={() => { onSuspend(driver.id); setOpenDropdown(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Icon name="xmark" className="w-4 h-4" /> Suspendre
                            </button>
                          )}
                        </div>
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
  );
};
