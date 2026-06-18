import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { StatusBadge } from '../ui/StatusBadge';

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

const STATUS_TONES: Record<string, 'orange' | 'blue' | 'violet' | 'green' | 'red' | 'slate'> = {
  awaiting_dispatch: 'orange',
  assigned: 'blue',
  driver_en_route: 'violet',
  pickup_completed: 'violet',
  processing: 'blue',
  delivery_en_route: 'orange',
  completed: 'green',
  cancelled: 'red',
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
        m => m.id.toLowerCase().includes(q) || m.client.toLowerCase().includes(q) || m.pickupCommune.toLowerCase().includes(q) || m.deliveryCommune.toLowerCase().includes(q) || (m.driverName && m.driverName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [missions, activeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE);
  const paginatedMissions = filteredMissions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilterChange = (key: string) => { setActiveFilter(key); setCurrentPage(1); };
  const handleSearch = (value: string) => { setSearchQuery(value); setCurrentPage(1); };

  return (
    <div className="rounded-2xl border border-surface-border-subtle bg-surface-card shadow-card">
      <div className="border-b border-surface-border-subtle p-4 sm:p-6">
        <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
                activeFilter === tab.key
                  ? 'bg-brand-blue text-white'
                  : 'bg-surface-muted text-content-muted hover:bg-surface-border'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-surface-border text-content-muted'
              }`}>
                {getCounts(tab.key)}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-surface-border bg-surface-muted py-2.5 pl-9 pr-4 text-sm text-content-primary placeholder:text-content-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border-subtle">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-content-muted">ID</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-content-muted">Client</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-content-muted">Chauffeur</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-content-muted">Zone</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-content-muted">Montant</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-content-muted">Statut</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase text-content-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border-subtle">
            {paginatedMissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <Icon name="search" className="mx-auto h-10 w-10 text-content-muted" />
                  <p className="mt-2 text-sm text-content-muted">Aucune mission trouvée</p>
                </td>
              </tr>
            ) : (
              paginatedMissions.map((mission) => (
                <tr key={mission.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="px-5 py-3 font-bold text-brand-blue">{mission.id}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-content-primary">{mission.client}</p>
                  </td>
                  <td className="px-5 py-3 text-content-muted">{mission.driverName || '—'}</td>
                  <td className="px-5 py-3">
                    <p className="text-content-primary">{mission.pickupCommune}</p>
                    <p className="text-[10px] text-content-muted">→ {mission.deliveryCommune}</p>
                  </td>
                  <td className="px-5 py-3 font-bold text-content-primary">{formatPrice(mission.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      label={STATUS_LABELS[mission.status] || mission.status}
                      tone={STATUS_TONES[mission.status] || 'slate'}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === mission.id ? null : mission.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-muted hover:bg-surface-muted"
                      >
                        <Icon name="bars3" className="h-4 w-4" />
                      </button>
                      {openDropdown === mission.id && (
                        <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-surface-border bg-surface-card py-1 shadow-lg">
                          <button onClick={() => { onView(mission.id); setOpenDropdown(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-content-primary hover:bg-surface-muted">
                            <Icon name="document-text" className="h-3.5 w-3.5" /> Voir
                          </button>
                          <button onClick={() => { onReassign(mission.id); setOpenDropdown(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-content-primary hover:bg-surface-muted">
                            <Icon name="arrow-path" className="h-3.5 w-3.5" /> Réassigner
                          </button>
                          <button onClick={() => { onCancel(mission.id); setOpenDropdown(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <Icon name="xmark" className="h-3.5 w-3.5" /> Annuler
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

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2 p-3">
        {paginatedMissions.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="search" className="mx-auto h-10 w-10 text-content-muted" />
            <p className="mt-2 text-sm text-content-muted">Aucune mission</p>
          </div>
        ) : (
          paginatedMissions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              onClick={() => onView(mission.id)}
              className="w-full rounded-2xl border border-surface-border-subtle bg-surface-card p-4 text-left transition active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-brand-blue">{mission.id}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-content-primary">{mission.client}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {mission.pickupCommune} → {mission.deliveryCommune} · {mission.distance} km
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge
                    label={STATUS_LABELS[mission.status] || mission.status}
                    tone={STATUS_TONES[mission.status] || 'slate'}
                  />
                  <p className="mt-1 text-xs font-bold text-content-primary">{formatPrice(mission.amount)}</p>
                </div>
              </div>
              {mission.driverName && (
                <p className="mt-2 rounded-lg bg-surface-muted px-2.5 py-1.5 text-[10px] font-bold text-content-muted">
                  Chauffeur: {mission.driverName}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border-subtle px-4 py-3 sm:px-6">
          <p className="text-xs text-content-muted">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMissions.length)} sur {filteredMissions.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-surface-muted text-xs font-bold text-content-primary disabled:opacity-40"
            >
              <Icon name="arrowLeft" className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-surface-muted text-xs font-bold text-content-primary disabled:opacity-40"
            >
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionTable;
