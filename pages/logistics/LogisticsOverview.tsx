import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/Icon';
import BacklogBoard from './BacklogBoard';
import ReadyDriversPanel from './ReadyDriversPanel';
import MissionTable from './MissionTable';
import DriversTable from './DriversTable';
import PerformanceDashboard from './PerformanceDashboard';
import OperationalAlerts from './OperationalAlerts';
import DispatchMap from './DispatchMap';

interface LogisticsOverviewProps {
  onRefresh: () => void;
  onAutoDispatch: () => void;
  onExport: () => void;
}

type DispatcherTab = 'operations' | 'missions' | 'drivers' | 'performance';

const MOCK_BACKLOG = Array.from({ length: 24 }, (_, i) => ({
  id: `MSN-${String(i + 1).padStart(3, '0')}`,
  client: ['Mama Jeanne', 'Patrick L.', 'Sarah K.', 'David M.', 'Grace N.', 'Paul O.', 'Marie C.', 'Jean B.'][i % 8],
  pickup: ['Av. Lumumba 42', 'Boulevard du 30 Juin', 'Av. Kasavubu 15', 'Rue Kasa-Vubu 8', 'Av. Sendwe 27'][i % 5],
  delivery: ['Gombe, Kinshasa', 'Lingwala, Kinshasa', 'Barumbu, Kinshasa', 'Kinshasa, Kinshasa', 'Ngiri-Ngiri, Kinshasa'][i % 5],
  distance: +(Math.random() * 12 + 1).toFixed(1),
  commune: ['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa', 'Ngiri-Ngiri', 'Bandalungwa', 'Kalamu', 'Matete'][i % 8],
  amount: Math.floor(Math.random() * 8000 + 2000),
  time: `${String(7 + (i % 12)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
}));

const MOCK_READY_DRIVERS = Array.from({ length: 18 }, (_, i) => ({
  name: ['Kabongo M.', 'Tshimanga A.', 'Mutombo P.', 'Kalonji S.', 'Ngoy L.', 'Ilunga B.', 'Kasongo R.', 'Mbuyi T.', 'Kanda F.', 'Mukendi J.', 'Kapenda N.', 'Kalala C.', 'Kolomba D.', 'Mwamba E.', 'Ngandu G.', 'Kayembe H.', 'Mbala I.', 'Tshilombo K.'][i],
  vehicle: ['Moto', 'Moto', 'Voiture', 'Moto', 'Moto', 'Tricycle', 'Moto', 'Moto', 'Voiture', 'Moto', 'Moto', 'Tricycle', 'Moto', 'Moto', 'Voiture', 'Moto', 'Moto', 'Moto'][i],
  rating: +(3.5 + Math.random() * 1.5).toFixed(1),
  commune: ['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa', 'Ngiri-Ngiri', 'Bandalungwa', 'Kalamu', 'Matete', 'Kimbanseke', 'Masina'][i % 10],
  status: i < 3 ? 'En mission' : 'Disponible',
  occupation: Math.floor(Math.random() * 85 + 15),
  avgTime: Math.floor(Math.random() * 20 + 15),
}));

const MOCK_ACTIVE_MISSIONS = Array.from({ length: 38 }, (_, i) => ({
  id: `MSN-${String(i + 1).padStart(3, '0')}`,
  status: ['En cours', 'Assignée', 'En attente'][i % 3],
  driver: MOCK_READY_DRIVERS[i % 18]?.name || 'N/A',
  commune: ['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa'][i % 4],
}));

const MOCK_PERFORMANCE = {
  missionsPerDay: [
    { day: 'Lun', count: 32 },
    { day: 'Mar', count: 28 },
    { day: 'Mer', count: 41 },
    { day: 'Jeu', count: 36 },
    { day: 'Ven', count: 45 },
    { day: 'Sam', count: 38 },
    { day: 'Dim', count: 22 },
  ],
  avgCollectionTime: 23,
  avgDeliveryTime: 34,
  revenue: 2450,
  onTimeRate: 92,
  totalMissions: 242,
  completionRate: 87,
};

const KPI_CARDS = [
  { label: 'Missions ouvertes', value: '24', sub: 'À assigner', icon: 'shoppingBag' as const, tone: 'bg-blue-50 text-brand-blue' },
  { label: 'Missions actives', value: '38', sub: '63% du flux', icon: 'truck' as const, tone: 'bg-violet-50 text-violet-600' },
  { label: 'Chauffeurs dispo', value: '18/32', sub: 'Réseau actif', icon: 'users' as const, tone: 'bg-green-50 text-green-600' },
  { label: 'Gains estimés', value: '2 450,00 $', sub: '92% à temps', icon: 'currencyDollar' as const, tone: 'bg-orange-50 text-orange-600' },
];

const TABS: { key: DispatcherTab; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'operations', label: 'Opérations', icon: 'map' },
  { key: 'missions', label: 'Missions', icon: 'shoppingBag' },
  { key: 'drivers', label: 'Chauffeurs', icon: 'users' },
  { key: 'performance', label: 'Performance', icon: 'chartBar' },
];

export const LogisticsOverview: React.FC<LogisticsOverviewProps> = ({ onRefresh, onAutoDispatch, onExport }) => {
  const [activeTab, setActiveTab] = useState<DispatcherTab>('operations');
  const [loading, setLoading] = useState<Record<DispatcherTab, boolean>>({
    operations: false,
    missions: false,
    drivers: false,
    performance: false,
  });

  useEffect(() => {
    setLoading((prev) => ({ ...prev, [activeTab]: true }));
    const timer = setTimeout(() => setLoading((prev) => ({ ...prev, [activeTab]: false })), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleRefresh = () => {
    setLoading((prev) => ({ ...prev, [activeTab]: true }));
    setTimeout(() => setLoading((prev) => ({ ...prev, [activeTab]: false })), 1200);
    onRefresh();
  };

  const renderTabContent = () => {
    if (loading[activeTab]) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Icon name="arrow-path" className="w-8 h-8 text-brand-blue animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Chargement...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'operations':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <BacklogBoard missions={MOCK_BACKLOG} />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <ReadyDriversPanel drivers={MOCK_READY_DRIVERS} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <DispatchMap />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <OperationalAlerts />
              </div>
            </div>
          </div>
        );
      case 'missions':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <MissionTable missions={MOCK_ACTIVE_MISSIONS} />
          </div>
        );
      case 'drivers':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <DriversTable drivers={MOCK_READY_DRIVERS} />
          </div>
        );
      case 'performance':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <PerformanceDashboard data={MOCK_PERFORMANCE} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1">COCKPIT DISPATCHER</p>
            <h1 className="text-2xl font-extrabold text-brand-dark">Centre logistique Laundry Express</h1>
            <p className="text-sm text-gray-500 mt-1">Pilotez les chauffeurs, assignez les missions, surveillez les retards et exportez vos opérations.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Icon name="arrow-path" className="w-4 h-4" /> Rafraîchir
            </button>
            <button
              onClick={onAutoDispatch}
              className="px-4 py-2 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-orange-600 flex items-center gap-2"
            >
              <Icon name="sparkles" className="w-4 h-4" /> Auto-dispatch
            </button>
            <button
              onClick={onExport}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${kpi.tone}`}>
                <Icon name={kpi.icon} className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="mt-1 text-3xl font-extrabold text-brand-dark">{kpi.value}</p>
                <p className="mt-1 text-xs text-gray-400">{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <nav className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6" aria-label="Sections logistiques">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white shadow-sm text-brand-dark'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
        {renderTabContent()}
      </div>
    </div>
  );
};
