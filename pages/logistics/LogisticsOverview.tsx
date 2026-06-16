import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { logisticsCard } from './logistics-ui';
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

type DispatcherTab = 'operations' | 'dispatch' | 'tours' | 'missions' | 'drivers' | 'performance';

const MOCK_BACKLOG = Array.from({ length: 24 }, (_, i) => ({
  id: `MSN-${String(i + 1).padStart(3, '0')}`,
  client: ['Mama Jeanne', 'Patrick L.', 'Sarah K.', 'David M.', 'Grace N.', 'Paul O.', 'Marie C.', 'Jean B.'][i % 8],
  pickup: ['Av. Lumumba 42', 'Boulevard du 30 Juin', 'Av. Kasavubu 15', 'Rue Kasa-Vubu 8', 'Av. Sendwe 27'][i % 5],
  delivery: ['Gombe, Kinshasa', 'Lingwala, Kinshasa', 'Barumbu, Kinshasa', 'Kinshasa, Kinshasa', 'Ngiri-Ngiri, Kinshasa'][i % 5],
  distance: Number((1.4 + (i % 9) * 0.8).toFixed(1)),
  commune: ['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa', 'Ngiri-Ngiri', 'Bandalungwa', 'Kalamu', 'Matete'][i % 8],
  amount: 2500 + (i % 7) * 850,
  time: `${String(7 + (i % 12)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
}));

const MOCK_READY_DRIVERS = Array.from({ length: 18 }, (_, i) => ({
  name: ['Kabongo M.', 'Tshimanga A.', 'Mutombo P.', 'Kalonji S.', 'Ngoy L.', 'Ilunga B.', 'Kasongo R.', 'Mbuyi T.', 'Kanda F.', 'Mukendi J.', 'Kapenda N.', 'Kalala C.', 'Kolomba D.', 'Mwamba E.', 'Ngandu G.', 'Kayembe H.', 'Mbala I.', 'Tshilombo K.'][i],
  vehicle: ['Moto', 'Moto', 'Voiture', 'Moto', 'Moto', 'Tricycle', 'Moto', 'Moto', 'Voiture', 'Moto', 'Moto', 'Tricycle', 'Moto', 'Moto', 'Voiture', 'Moto', 'Moto', 'Moto'][i],
  rating: Number((4.9 - (i % 8) * 0.13).toFixed(1)),
  commune: ['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa', 'Ngiri-Ngiri', 'Bandalungwa', 'Kalamu', 'Matete', 'Kimbanseke', 'Masina'][i % 10],
  status: i < 3 ? 'En mission' : 'Disponible',
  occupation: 18 + (i % 9) * 8,
  avgTime: 15 + (i % 7) * 3,
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

const formatCdf = (value: number) => `${value.toLocaleString('fr-FR')} FC`;

const openMissionsCount = MOCK_BACKLOG.length;
const activeMissionsCount = MOCK_ACTIVE_MISSIONS.length;
const totalMissionFlow = openMissionsCount + activeMissionsCount;
const activeMissionRate = Math.round((activeMissionsCount / totalMissionFlow) * 100);
const totalDriversCount = MOCK_READY_DRIVERS.length;
const availableDriversCount = MOCK_READY_DRIVERS.filter((driver) => driver.status === 'Disponible').length;
const estimatedBacklogRevenue = MOCK_BACKLOG.reduce((total, mission) => total + mission.amount, 0);

const KPI_CARDS = [
  { label: 'Missions ouvertes', value: String(openMissionsCount), sub: 'À assigner', icon: 'shoppingBag' as const, tone: 'bg-blue-50 text-brand-blue' },
  { label: 'Missions actives', value: String(activeMissionsCount), sub: `${activeMissionRate}% du flux`, icon: 'truck' as const, tone: 'bg-violet-50 text-violet-600' },
  { label: 'Chauffeurs dispo', value: `${availableDriversCount}/${totalDriversCount}`, sub: 'Réseau actif', icon: 'users' as const, tone: 'bg-green-50 text-green-600' },
  { label: 'Volume estimé', value: formatCdf(estimatedBacklogRevenue), sub: 'Backlog non assigné', icon: 'currencyDollar' as const, tone: 'bg-orange-50 text-orange-600' },
];

const TABS: { key: DispatcherTab; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'operations', label: 'Opérations', icon: 'map' },
  { key: 'dispatch', label: 'Dispatch intelligent', icon: 'sparkles' },
  { key: 'tours', label: 'Tournées', icon: 'truck' },
  { key: 'missions', label: 'Missions', icon: 'shoppingBag' },
  { key: 'drivers', label: 'Chauffeurs', icon: 'users' },
  { key: 'performance', label: 'Performance', icon: 'chartBar' },
];

const DISPATCH_SUGGESTIONS = MOCK_BACKLOG.slice(0, 6).map((mission, index) => {
  const driver = MOCK_READY_DRIVERS[(index * 2) % MOCK_READY_DRIVERS.length];
  const isDriverFree = driver.status === 'Disponible';
  return {
    missionId: mission.id,
    client: mission.client,
    time: mission.time,
    driver: driver.name,
    driverStatus: isDriverFree ? 'dispo' : 'en mission',
    distance: Number((mission.distance * 0.38 + index * 0.12).toFixed(1)),
    score: Math.max(72, 98 - index * 4),
    action: isDriverFree ? 'Assigner' : 'Planifier',
  };
});

const ACTIVE_TOURS = [
  { id: 'T-001', driver: 'Kabongo M.', pickups: 3, deliveries: 4, status: 'En cours', progress: 62, nextStop: 'Av. Lumumba 42', eta: '18 min' },
  { id: 'T-002', driver: 'Mutombo P.', pickups: 2, deliveries: 5, status: 'Optimisée', progress: 44, nextStop: 'Gombe Centre', eta: '24 min' },
  { id: 'T-003', driver: 'Kanda F.', pickups: 5, deliveries: 2, status: 'Prévue', progress: 18, nextStop: 'Limete 7e Rue', eta: '36 min' },
];

const DRIVER_RANKING = MOCK_READY_DRIVERS.slice(0, 8).map((driver, index) => ({
  ...driver,
  missions: 34 - index * 2,
  onTime: 96 - index * 3,
  delays: index < 2 ? index : index + 1,
  coaching: index > 4,
}));

const ACTIONABLE_ALERTS = [
  { id: 'ALT-1', tone: 'red', title: 'Retard critique', detail: 'Tshimanga A. dépasse le SLA de 18 min sur MSN-004.', primary: 'Réassigner', secondary: 'Contacter' },
  { id: 'ALT-2', tone: 'orange', title: 'Zone saturée', detail: 'Limete compte 6 collectes non assignées.', primary: 'Dispatcher', secondary: 'Voir zone' },
  { id: 'ALT-3', tone: 'green', title: 'Relais disponible', detail: '3 chauffeurs terminent une tournée dans moins de 15 min.', primary: 'Préparer relais', secondary: 'Voir chauffeurs' },
];

const SuggestedDispatchTable: React.FC<{
  onAutoDispatch: () => void;
  onApplySuggestion: (label: string) => void;
}> = ({ onAutoDispatch, onApplySuggestion }) => (
  <div className={`${logisticsCard} overflow-hidden`}>
    <div className="flex flex-col gap-3 border-b border-surface-border-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h2 className="flex items-center gap-2 text-base font-extrabold text-content-primary sm:text-lg">
          <Icon name="sparkles" className="w-5 h-5 text-brand-orange" />
          Suggestions auto-dispatch
        </h2>
        <p className="text-xs text-content-muted mt-1">Score basé sur distance, charge, disponibilité et historique chauffeur.</p>
      </div>
      <button
        type="button"
        onClick={onAutoDispatch}
        className="min-h-11 rounded-xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 sm:min-h-0 sm:py-2"
      >
        Appliquer les meilleures suggestions
      </button>
    </div>
    <div className="space-y-3 p-4 sm:hidden">
      {DISPATCH_SUGGESTIONS.map((row) => (
        <article key={row.missionId} className="rounded-xl border border-surface-border-subtle bg-surface-muted/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-content-primary">#{row.missionId}</p>
              <p className="mt-1 text-sm font-semibold text-content-primary">{row.client}</p>
              <p className="text-xs text-content-muted">{row.time} · {row.distance} km</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-blue">{row.score}%</span>
          </div>
          <div className="mt-3 rounded-lg bg-surface-card p-3">
            <p className="text-sm font-semibold text-content-primary">{row.driver}</p>
            <p className={`text-xs ${row.driverStatus === 'dispo' ? 'text-green-600' : 'text-orange-600'}`}>
              {row.driverStatus === 'dispo' ? 'Disponible maintenant' : 'À planifier après mission'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onApplySuggestion(`${row.action} ${row.missionId} à ${row.driver}`)}
            className="mt-3 min-h-11 w-full rounded-xl border border-brand-blue px-4 text-sm font-bold text-brand-blue hover:bg-brand-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            {row.action}
          </button>
        </article>
      ))}
    </div>
    <div className="hidden overflow-x-auto sm:block">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-content-muted">
          <tr>
            <th className="text-left px-5 py-3">Mission</th>
            <th className="text-left px-5 py-3">Client</th>
            <th className="text-left px-5 py-3">Heure</th>
            <th className="text-left px-5 py-3">Chauffeur suggéré</th>
            <th className="text-left px-5 py-3">Distance</th>
            <th className="text-left px-5 py-3">Score</th>
            <th className="text-right px-5 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {DISPATCH_SUGGESTIONS.map((row) => (
            <tr key={row.missionId} className="hover:bg-gray-50/60">
              <td className="px-5 py-4 font-mono font-bold text-content-primary">#{row.missionId}</td>
              <td className="px-5 py-4 text-content-primary">{row.client}</td>
              <td className="px-5 py-4 text-content-muted">{row.time}</td>
              <td className="px-5 py-4">
                <div className="font-semibold text-content-primary">{row.driver}</div>
                <div className={`text-xs ${row.driverStatus === 'dispo' ? 'text-green-600' : 'text-orange-600'}`}>
                  {row.driverStatus === 'dispo' ? 'Disponible maintenant' : 'À planifier après mission'}
                </div>
              </td>
              <td className="px-5 py-4 text-content-muted">{row.distance} km</td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-blue">
                  {row.score}%
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onApplySuggestion(`${row.action} ${row.missionId} à ${row.driver}`)}
                  className="rounded-lg border border-brand-blue px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                >
                  {row.action}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ToursBoard: React.FC<{ onOpenTour: (tourId: string) => void }> = ({ onOpenTour }) => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
    {ACTIVE_TOURS.map((tour) => (
      <article key={tour.id} className={`${logisticsCard} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-brand-blue">#{tour.id}</p>
            <h3 className="mt-1 text-lg font-extrabold text-content-primary">{tour.driver}</h3>
            <p className="mt-1 text-sm text-content-muted">Prochain arrêt : {tour.nextStop}</p>
          </div>
          <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{tour.status}</span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-xl font-extrabold text-brand-blue">{tour.pickups}</p>
            <p className="text-[11px] text-content-muted">Collectes</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-3">
            <p className="text-xl font-extrabold text-brand-orange">{tour.deliveries}</p>
            <p className="text-[11px] text-content-muted">Livraisons</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xl font-extrabold text-content-primary">{tour.eta}</p>
            <p className="text-[11px] text-content-muted">ETA</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold text-content-muted mb-2">
            <span>Progression tournée</span>
            <span>{tour.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-blue" style={{ width: `${tour.progress}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenTour(tour.id)}
          className="mt-5 min-h-11 w-full rounded-xl border border-brand-blue px-4 py-2 text-sm font-bold text-brand-blue hover:bg-brand-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
        >
          Ouvrir la tournée
        </button>
      </article>
    ))}
  </div>
);

const ALERT_TONE_CLASS: Record<string, string> = {
  red: 'border-red-500/35 bg-red-500/15 text-red-100',
  orange: 'border-orange-500/35 bg-orange-500/15 text-orange-100',
  green: 'border-green-500/35 bg-green-500/15 text-green-100',
};

const ActionableAlertsStrip: React.FC<{ onAlertAction: (label: string) => void }> = ({ onAlertAction }) => (
  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
    {ACTIONABLE_ALERTS.map((alert) => {
      const tone = ALERT_TONE_CLASS[alert.tone] || ALERT_TONE_CLASS.green;
      return (
        <article key={alert.id} className={`rounded-2xl border p-4 ${tone}`}>
          <h3 className="text-sm font-extrabold text-content-primary">{alert.title}</h3>
          <p className="mt-1 min-h-[40px] text-sm text-content-muted">{alert.detail}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => onAlertAction(`${alert.primary} - ${alert.title}`)}
              className="min-h-10 rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-xs font-bold shadow-sm hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
            >
              {alert.primary}
            </button>
            <button
              type="button"
              onClick={() => onAlertAction(`${alert.secondary} - ${alert.title}`)}
              className="min-h-10 rounded-lg px-3 py-2 text-xs font-bold hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
            >
              {alert.secondary}
            </button>
          </div>
        </article>
      );
    })}
  </div>
);

const DriverLeaderboard: React.FC<{ onDriverAction: (label: string) => void }> = ({ onDriverAction }) => (
  <div className={`${logisticsCard} overflow-hidden`}>
    <div className="border-b border-surface-border-subtle px-4 py-4 sm:px-5">
      <h2 className="flex items-center gap-2 text-base font-extrabold text-content-primary sm:text-lg">
        <Icon name="trophy" className="w-5 h-5 text-brand-orange" />
        Performance chauffeur individuelle
      </h2>
    </div>
    <div className="space-y-3 p-4 sm:hidden">
      {DRIVER_RANKING.map((driver) => (
        <article key={driver.name} className="rounded-xl border border-surface-border-subtle bg-surface-muted/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-content-primary">{driver.name}</p>
              <p className="mt-1 text-xs text-content-muted">{driver.missions} missions · {driver.delays} retards</p>
            </div>
            <span className="flex items-center gap-1 font-bold text-content-primary">
              <Icon name="star" className="h-3.5 w-3.5 text-yellow-500" />
              {driver.rating}
            </span>
          </div>
          <div className="mt-3 rounded-lg bg-surface-card p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-content-muted">À temps</span>
              <span className={`font-bold ${driver.onTime >= 90 ? 'text-green-600' : 'text-orange-600'}`}>{driver.onTime}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDriverAction(`${driver.coaching ? 'Coaching' : 'Statistiques'} - ${driver.name}`)}
            className={`mt-3 min-h-11 w-full rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 ${driver.coaching ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-brand-blue'}`}
          >
            {driver.coaching ? 'Coaching' : 'Voir stats'}
          </button>
        </article>
      ))}
    </div>
    <div className="hidden overflow-x-auto sm:block">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-content-muted">
          <tr>
            <th className="text-left px-5 py-3">Chauffeur</th>
            <th className="text-left px-5 py-3">Missions</th>
            <th className="text-left px-5 py-3">À temps</th>
            <th className="text-left px-5 py-3">Retards</th>
            <th className="text-left px-5 py-3">Note</th>
            <th className="text-right px-5 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {DRIVER_RANKING.map((driver) => (
            <tr key={driver.name}>
              <td className="px-5 py-4 font-bold text-content-primary">{driver.name}</td>
              <td className="px-5 py-4 text-content-muted">{driver.missions}</td>
              <td className="px-5 py-4">
                <span className={`font-bold ${driver.onTime >= 90 ? 'text-green-600' : 'text-orange-600'}`}>{driver.onTime}%</span>
              </td>
              <td className="px-5 py-4 text-content-muted">{driver.delays}</td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1 font-bold text-content-primary">
                  <Icon name="star" className="w-3.5 h-3.5 text-yellow-500" />
                  {driver.rating}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onDriverAction(`${driver.coaching ? 'Coaching' : 'Statistiques'} - ${driver.name}`)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 ${driver.coaching ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-brand-blue'}`}
                >
                  {driver.coaching ? 'Coaching' : 'Voir stats'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const LogisticsOverview: React.FC<LogisticsOverviewProps> = ({ onRefresh, onAutoDispatch, onExport }) => {
  const [activeTab, setActiveTab] = useState<DispatcherTab>('operations');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<DispatcherTab, boolean>>({
    operations: false,
    dispatch: false,
    tours: false,
    missions: false,
    drivers: false,
    performance: false,
  });

  useEffect(() => {
    setLoading((prev) => ({ ...prev, [activeTab]: true }));
    const timer = setTimeout(() => setLoading((prev) => ({ ...prev, [activeTab]: false })), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const announceAction = (message: string) => {
    setActionMessage(message);
  };

  const handleAutoDispatch = () => {
    onAutoDispatch();
    announceAction('Auto-dispatch lancé. Les meilleures suggestions sont prêtes à être validées.');
  };

  const handleRefresh = () => {
    setLoading((prev) => ({ ...prev, [activeTab]: true }));
    setTimeout(() => setLoading((prev) => ({ ...prev, [activeTab]: false })), 1200);
    onRefresh();
    announceAction(`Section ${TABS.find((tab) => tab.key === activeTab)?.label || 'active'} rafraîchie.`);
  };

  const renderTabContent = () => {
    if (loading[activeTab]) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Icon name="arrow-path" className="w-8 h-8 text-brand-blue animate-spin" />
            <p className="text-sm text-content-muted font-medium">Chargement...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'operations':
        return (
          <div className="space-y-6">
            <ActionableAlertsStrip onAlertAction={(label) => announceAction(`Action prioritaire enregistrée : ${label}.`)} />
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
              <div className={`${logisticsCard} p-5`}>
                <BacklogBoard missions={MOCK_BACKLOG} />
              </div>
              <div className={`${logisticsCard} p-5`}>
                <ReadyDriversPanel drivers={MOCK_READY_DRIVERS} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${logisticsCard} p-5`}>
                <DispatchMap />
              </div>
              <div className={`${logisticsCard} p-5`}>
                <OperationalAlerts />
              </div>
            </div>
          </div>
        );
      case 'dispatch':
        return (
          <SuggestedDispatchTable
            onAutoDispatch={handleAutoDispatch}
            onApplySuggestion={(label) => announceAction(`Suggestion appliquée : ${label}.`)}
          />
        );
      case 'tours':
        return (
          <div className="space-y-5">
            <div className={`${logisticsCard} p-5`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-content-primary">Mode tournées multi-arrêts</h2>
                  <p className="text-sm text-content-muted">Regroupez collectes et livraisons pour Laundry Express, colis, repas, pharmacie ou courses.</p>
                </div>
                <button
                  type="button"
                  onClick={() => announceAction('Optimisation lancée pour les tournées multi-arrêts.')}
                  className="min-h-11 w-full rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 sm:w-auto"
                >
                  Optimiser les tournées
                </button>
              </div>
            </div>
            <ToursBoard onOpenTour={(tourId) => announceAction(`Tournée ${tourId} ouverte pour supervision.`)} />
          </div>
        );
      case 'missions':
        return (
          <div className={`${logisticsCard} p-5`}>
            <MissionTable missions={MOCK_ACTIVE_MISSIONS} />
          </div>
        );
      case 'drivers':
        return (
          <div className={`${logisticsCard} p-5`}>
            <DriversTable drivers={MOCK_READY_DRIVERS} />
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <div className={`${logisticsCard} p-5`}>
              <PerformanceDashboard data={MOCK_PERFORMANCE} />
            </div>
            <DriverLeaderboard onDriverAction={(label) => announceAction(`Action chauffeur ouverte : ${label}.`)} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${logisticsCard} p-4 sm:p-6`}>
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1">COCKPIT DISPATCHER</p>
            <h1 className="text-xl font-extrabold leading-tight text-content-primary sm:text-2xl">Cockpit logistique universel</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-content-muted">Pilotez dispatch, carte, tournées, alertes et performance chauffeur pour pressing, colis, repas, pharmacie ou courses.</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 rounded-xl border border-surface-border-subtle px-4 py-3 text-sm font-semibold text-content-primary hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 sm:py-2"
            >
              <Icon name="arrow-path" className="w-4 h-4" /> Rafraîchir
            </button>
            <button
              type="button"
              onClick={handleAutoDispatch}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 sm:py-2"
            >
              <Icon name="sparkles" className="w-4 h-4" /> Auto-dispatch
            </button>
            <button
              type="button"
              onClick={onExport}
              className="flex items-center justify-center gap-2 rounded-xl border border-surface-border-subtle px-4 py-3 text-sm font-semibold text-content-primary hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 sm:py-2"
            >
              <Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          role="status"
          className="rounded-2xl border border-brand-blue/30 bg-brand-blue/15 px-5 py-3 text-sm font-semibold text-blue-100"
        >
          {actionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.label} className={`${logisticsCard} p-4 sm:p-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14 ${kpi.tone}`}>
                <Icon name={kpi.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-content-muted sm:text-sm">{kpi.label}</p>
                <p className="mt-1 break-words text-xl font-extrabold tracking-tight text-content-primary sm:text-3xl">{kpi.value}</p>
                <p className="mt-1 text-xs font-medium text-content-muted">{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <nav className="-mx-3 mb-5 flex gap-2 overflow-x-auto bg-surface-muted px-3 py-2 sm:mx-0 sm:mb-6 sm:rounded-xl sm:p-1" role="tablist" aria-label="Sections logistiques">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 sm:min-h-0 sm:py-2 ${
                activeTab === tab.key
                  ? 'bg-surface-card text-content-primary shadow-sm'
                  : 'text-content-muted hover:text-content-primary'
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
