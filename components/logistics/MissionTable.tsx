import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';

interface Mission {
  id: string;
  client: string;
  clientPhone: string;
  pickupAddress: string;
  pickupCommune: string;
  deliveryAddress: string;
  deliveryCommune: string;
  distance: number;
  amount: number;
  time: string;
  date: string;
  status: string;
  driverName?: string;
  priority?: string;
}

interface MissionTableProps {
  missions: Mission[];
  onReassign: (missionId: string) => void;
  onView: (missionId: string) => void;
  onCancel: (missionId: string) => void;
  formatPrice: (price: number) => string;
}

const STATUS_LABELS: Record<string, string> = {
  awaiting_dispatch: 'En attente',
  assigned: 'Assignée',
  driver_en_route: 'Chauffeur en route',
  pickup_completed: 'Collecte effectuée',
  processing: 'En traitement',
  delivery_en_route: 'En livraison',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_CLASSES: Record<string, string> = {
  awaiting_dispatch: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  driver_en_route: 'bg-purple-100 text-purple-700',
  pickup_completed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-cyan-100 text-cyan-700',
  delivery_en_route: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const FILTER_TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'awaiting_dispatch', label: 'En attente' },
  { key: 'assigned', label: 'Assignées' },
  { key: 'pickup', label: 'Collecte' },
  { key: 'delivery', label: 'Livraison' },
  { key: 'completed', label: 'Terminées' },
  { key: 'cancelled', label: 'Annulées' },
];

const MOCK_MISSIONS: Mission[] = [
  { id: 'M-001', client: 'Fatima Benali', clientPhone: '+213 555 010 001', pickupAddress: '12 Rue Didouche Mourad', pickupCommune: 'Alger Centre', deliveryAddress: '45 Rue Abane Ramdane', deliveryCommune: 'Bab El Oued', distance: 4.2, amount: 800, time: '09:00', date: '2026-06-07', status: 'awaiting_dispatch', priority: 'high' },
  { id: 'M-002', client: 'Yacine Khelifi', clientPhone: '+213 555 010 002', pickupAddress: '8 Boulevard Khemisti', pickupCommune: 'Hydra', deliveryAddress: '23 Rue des Frères Abbas', deliveryCommune: 'Ben Aknoun', distance: 6.1, amount: 1200, time: '09:30', date: '2026-06-07', status: 'assigned', driverName: 'Mohamed Amine', priority: 'normal' },
  { id: 'M-003', client: 'Sara Medjahdi', clientPhone: '+213 555 010 003', pickupAddress: "56 Rue Larbi Ben M'hidi", pickupCommune: 'Casbah', deliveryAddress: '11 Avenue Colonel Lotfi', deliveryCommune: "Bir Mourad Raïs", distance: 7.8, amount: 1500, time: '10:00', date: '2026-06-07', status: 'driver_en_route', driverName: 'Amine Bouzid' },
  { id: 'M-004', client: 'Omar Boudiaf', clientPhone: '+213 555 010 004', pickupAddress: '3 Rue Abane Ramdane', pickupCommune: 'El Biar', deliveryAddress: '78 Boulevard Krim Belkacem', deliveryCommune: 'Dely Ibrahim', distance: 12.3, amount: 2200, time: '10:30', date: '2026-06-07', status: 'pickup_completed', driverName: 'Youcef Hamidi' },
  { id: 'M-005', client: 'Amina Touati', clientPhone: '+213 555 010 005', pickupAddress: '19 Rue Ahmed Bey', pickupCommune: 'Kouba', deliveryAddress: "32 Avenue de l'ALN", deliveryCommune: 'Hussein Dey', distance: 3.5, amount: 700, time: '11:00', date: '2026-06-07', status: 'processing', driverName: 'Karim Zeroual' },
  { id: 'M-006', client: 'Rachid Zermani', clientPhone: '+213 555 010 006', pickupAddress: '42 Boulevard Emir Abdelkader', pickupCommune: 'Alger Centre', deliveryAddress: '15 Rue Ahmed Orfan', deliveryCommune: "Sidi M'Hamed", distance: 2.8, amount: 600, time: '11:30', date: '2026-06-07', status: 'delivery_en_route', driverName: 'Nabil Ferhat' },
  { id: 'M-007', client: 'Leila Benmalek', clientPhone: '+213 555 010 007', pickupAddress: '7 Rue Chahid Bouzidi', pickupCommune: 'Birkhadem', deliveryAddress: '55 Avenue Pasteur', deliveryCommune: 'Alger Centre', distance: 5.4, amount: 1000, time: '12:00', date: '2026-06-07', status: 'completed', driverName: 'Mohamed Amine' },
  { id: 'M-008', client: 'Karim Ait Ahmed', clientPhone: '+213 555 010 008', pickupAddress: '28 Rue Didouche Mourad', pickupCommune: 'El Harrach', deliveryAddress: '9 Boulevard Colonel Amirouche', deliveryCommune: 'Bourouba', distance: 8.7, amount: 1800, time: '13:00', date: '2026-06-07', status: 'cancelled' },
  { id: 'M-009', client: 'Nadia Cherifi', clientPhone: '+213 555 010 009', pickupAddress: "61 Rue Larbi Ben M'hidi", pickupCommune: 'Dar El Beïda', deliveryAddress: '14 Rue Abane Ramdane', deliveryCommune: 'Bab Ezzouar', distance: 9.2, amount: 1900, time: '14:00', date: '2026-06-07', status: 'awaiting_dispatch', priority: 'high' },
  { id: 'M-010', client: 'Samir Zeroual', clientPhone: '+213 555 010 010', pickupAddress: '10 Boulevard Khemisti', pickupCommune: 'Oran', deliveryAddress: '37 Rue des Frères Abbas', deliveryCommune: 'Es Senia', distance: 5.1, amount: 1100, time: '09:15', date: '2026-06-07', status: 'assigned', driverName: 'Amine Bouzid' },
  { id: 'M-011', client: 'Houda Belkacem', clientPhone: '+213 555 010 011', pickupAddress: '22 Rue Ahmed Bey', pickupCommune: 'Constantine', deliveryAddress: "48 Avenue de l'ALN", deliveryCommune: 'El Khroub', distance: 11.5, amount: 2100, time: '10:45', date: '2026-06-07', status: 'driver_en_route', driverName: 'Youcef Hamidi' },
  { id: 'M-012', client: 'Mourad Djelloul', clientPhone: '+213 555 010 012', pickupAddress: '33 Boulevard Emir Abdelkader', pickupCommune: 'Annaba', deliveryAddress: '18 Rue Chahid Bouzidi', deliveryCommune: 'El Bouni', distance: 7.3, amount: 1400, time: '11:15', date: '2026-06-07', status: 'completed', driverName: 'Karim Zeroual' },
  { id: 'M-013', client: 'Salima Hadj', clientPhone: '+213 555 010 013', pickupAddress: '5 Boulevard Colonel Lotfi', pickupCommune: 'Blida', deliveryAddress: '41 Rue Didouche Mourad', deliveryCommune: 'Boufarik', distance: 14.8, amount: 2800, time: '15:00', date: '2026-06-07', status: 'awaiting_dispatch', priority: 'normal' },
  { id: 'M-014', client: 'Reda Makhlouf', clientPhone: '+213 555 010 014', pickupAddress: '16 Rue Abane Ramdane', pickupCommune: 'Sétif', deliveryAddress: '29 Avenue Colonel Amirouche', deliveryCommune: 'El Eulma', distance: 18.2, amount: 3500, time: '08:30', date: '2026-06-06', status: 'completed', driverName: 'Nabil Ferhat' },
  { id: 'M-015', client: 'Lamia Bouchama', clientPhone: '+213 555 010 015', pickupAddress: "50 Rue Larbi Ben M'hidi", pickupCommune: 'Batna', deliveryAddress: '7 Rue Ahmed Orfan', deliveryCommune: 'Barika', distance: 22.1, amount: 4200, time: '16:00', date: '2026-06-06', status: 'cancelled' },
];

const ITEMS_PER_PAGE = 5;

export const MissionTable: React.FC<MissionTableProps> = ({
  missions,
  onReassign,
  onView,
  onCancel,
  formatPrice,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const todayStr = '2026-06-07';

  const getCounts = (key: string) => {
    switch (key) {
      case 'all': return missions.length;
      case 'today': return missions.filter(m => m.date === todayStr).length;
      case 'awaiting_dispatch': return missions.filter(m => m.status === 'awaiting_dispatch').length;
      case 'assigned': return missions.filter(m => m.status === 'assigned').length;
      case 'pickup': return missions.filter(m => m.status === 'driver_en_route' || m.status === 'pickup_completed').length;
      case 'delivery': return missions.filter(m => m.status === 'delivery_en_route' || m.status === 'processing').length;
      case 'completed': return missions.filter(m => m.status === 'completed').length;
      case 'cancelled': return missions.filter(m => m.status === 'cancelled').length;
      default: return 0;
    }
  };

  const filteredMissions = useMemo(() => {
    let result = missions;

    switch (activeFilter) {
      case 'today': result = result.filter(m => m.date === todayStr); break;
      case 'awaiting_dispatch': result = result.filter(m => m.status === 'awaiting_dispatch'); break;
      case 'assigned': result = result.filter(m => m.status === 'assigned'); break;
      case 'pickup': result = result.filter(m => m.status === 'driver_en_route' || m.status === 'pickup_completed'); break;
      case 'delivery': result = result.filter(m => m.status === 'delivery_en_route' || m.status === 'processing'); break;
      case 'completed': result = result.filter(m => m.status === 'completed'); break;
      case 'cancelled': result = result.filter(m => m.status === 'cancelled'); break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        m =>
          m.id.toLowerCase().includes(q) ||
          m.client.toLowerCase().includes(q) ||
          m.pickupCommune.toLowerCase().includes(q) ||
          m.deliveryCommune.toLowerCase().includes(q) ||
          (m.driverName && m.driverName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [missions, activeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE);
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (key: string) => {
    setActiveFilter(key);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
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
            placeholder="Rechercher par ID, client, commune ou chauffeur..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Chauffeur</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Commune</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Heure</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedMissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Icon name="search" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucune mission trouvée</p>
                </td>
              </tr>
            ) : (
              paginatedMissions.map((mission) => (
                <tr key={mission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-brand-blue">{mission.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{mission.client}</div>
                    <div className="text-xs text-gray-500">{mission.clientPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{mission.driverName || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{mission.pickupCommune}</div>
                    <div className="text-xs text-gray-400">→ {mission.deliveryCommune}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatPrice(mission.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_CLASSES[mission.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[mission.status] || mission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{mission.time}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === mission.id ? null : mission.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Icon name="bars3" className="w-4 h-4" />
                      </button>
                      {openDropdown === mission.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                          <button
                            onClick={() => { onView(mission.id); setOpenDropdown(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon name="document-text" className="w-4 h-4" /> Voir
                          </button>
                          <button
                            onClick={() => { onReassign(mission.id); setOpenDropdown(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon name="arrow-path" className="w-4 h-4" /> Réassigner
                          </button>
                          <button
                            onClick={() => { onCancel(mission.id); setOpenDropdown(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Icon name="xmark" className="w-4 h-4" /> Annuler
                          </button>
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

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMissions.length)} sur {filteredMissions.length} missions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="arrowLeft" className="w-4 h-4 inline mr-1" />
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <Icon name="arrowRight" className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
