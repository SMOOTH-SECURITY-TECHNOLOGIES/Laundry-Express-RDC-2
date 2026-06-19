import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../components/Icon';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DispatcherMobileUrgency } from '../../components/dispatcher/DispatcherMobileUrgency';
import { logisticsCard } from './logistics-ui';
import BacklogBoard from './BacklogBoard';
import ReadyDriversPanel from './ReadyDriversPanel';
import MissionTable from './MissionTable';
import DriversTable from './DriversTable';
import PerformanceDashboard from './PerformanceDashboard';
import OperationalAlerts from './OperationalAlerts';
import DispatchMap from './DispatchMap';
import {
  realApi,
  type AdminSupportTicket,
  type BackendActivityLogDashboardResponse,
  type LogisticsDriver,
  type LogisticsMaintenanceEvent,
  type LogisticsTask,
  type LogisticsVehicle,
  type Order,
} from '../../services/real-api';
import {
  driverProfileToReadyDriver,
  getLogisticsDrivers,
  getMissionRows,
  storeBacklogMissionForDispatch,
  type DataMode,
  type LogisticsBacklogMission,
  type LogisticsMissionRow,
  type LogisticsReadyDriver,
} from '../../services/logistics-api';
import { useRealTimeAlerts } from '../../hooks/useRealTimeAlerts';
import { useRealTimeTracking } from '../../hooks/useRealTimeTracking';

interface LogisticsOverviewProps {
  onRefresh: () => void;
  onAutoDispatch: () => void;
  onExport: () => void;
  onNavigate?: (section: string, options?: { missionId?: string; driverName?: string; zone?: string }) => void;
  onActionFeedback?: (message: string) => void;
}

type DispatcherTab = 'operations' | 'dispatch' | 'tours' | 'missions' | 'drivers' | 'performance';

interface ActionableAlert {
  id: string;
  tone: string;
  title: string;
  detail: string;
  missionId?: string;
  driverName?: string;
  zone?: string;
  primary: string;
  secondary: string;
}

const routeAlertAction = (
  alert: ActionableAlert,
  action: string,
  onNavigate: LogisticsOverviewProps['onNavigate'],
  onMessage: (message: string) => void,
) => {
  if (alert.missionId && ['Réassigner', 'Dispatcher'].includes(action)) {
    onNavigate?.('dispatch', { missionId: alert.missionId });
    onMessage(`Ouverture du dispatch pour ${alert.missionId}.`);
    return;
  }
  if (alert.missionId && action === 'Contacter') {
    onNavigate?.('drivers', { driverName: alert.driverName });
    onMessage(`Ouverture du chauffeur ${alert.driverName || 'assigné'}.`);
    return;
  }
  if (alert.zone) {
    onNavigate?.('dispatch', { zone: alert.zone });
    onMessage(`Filtre dispatch ouvert pour la zone ${alert.zone}.`);
    return;
  }
  if (action === 'Préparer relais' || action === 'Voir chauffeurs') {
    onNavigate?.('drivers');
    onMessage('Ouverture des chauffeurs disponibles pour préparer le relais.');
    return;
  }
  onNavigate?.('alerts');
  onMessage(`Ouverture des alertes pour ${alert.title}.`);
};

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

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusIn = (status: string | null | undefined, values: string[]) => values.includes((status || '').toLowerCase());

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

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

const ACTIONABLE_ALERTS: ActionableAlert[] = [
  { id: 'ALT-1', tone: 'red', title: 'Retard critique', detail: 'Tshimanga A. dépasse le SLA de 18 min sur MSN-004.', missionId: 'MSN-004', driverName: 'Tshimanga A.', primary: 'Réassigner', secondary: 'Contacter' },
  { id: 'ALT-2', tone: 'orange', title: 'Zone saturée', detail: 'Limete compte 6 collectes non assignées.', zone: 'Limete', primary: 'Dispatcher', secondary: 'Voir zone' },
  { id: 'ALT-3', tone: 'green', title: 'Relais disponible', detail: '3 chauffeurs terminent une tournée dans moins de 15 min.', primary: 'Préparer relais', secondary: 'Voir chauffeurs' },
];

const ACTIVITY_BARS = [
  { label: '06h', value: 12, tone: 'low' },
  { label: '08h', value: 24, tone: 'mid' },
  { label: '10h', value: 18, tone: 'mid' },
  { label: '12h', value: 38, tone: 'high' },
  { label: '14h', value: 44, tone: 'high' },
  { label: '16h', value: 35, tone: 'high' },
  { label: '18h', value: 28, tone: 'mid' },
  { label: '20h', value: 20, tone: 'mid' },
  { label: '22h', value: 30, tone: 'high' },
];

const CONTROL_TOWER_ORDERS = [
  { id: 'MSN-004', address: 'Av. Lumumba 42, Gombe', eta: '12 min', status: 'Retard', tone: 'red' },
  { id: 'MSN-019', address: 'Limete 7e Rue', eta: '20 min', status: 'À assigner', tone: 'orange' },
  { id: 'MSN-014', address: 'Boulevard du 30 Juin', eta: '18 min', status: 'En transit', tone: 'lime' },
  { id: 'MSN-011', address: 'Kasavubu 15, Barumbu', eta: '24 min', status: 'Assignée', tone: 'blue' },
  { id: 'MSN-007', address: 'Matete marché', eta: '31 min', status: 'Paiement', tone: 'violet' },
];

const TOP_ZONES = [
  { zone: 'Gombe', missions: 18, onTime: 94, pressure: 'stable' },
  { zone: 'Limete', missions: 15, onTime: 82, pressure: 'watch' },
  { zone: 'Lingwala', missions: 11, onTime: 91, pressure: 'stable' },
  { zone: 'Matete', missions: 8, onTime: 76, pressure: 'stop' },
];

const CONTROL_TOWER_STATUS = [
  { label: 'À assigner', value: 20, tone: 'bg-orange-400 text-slate-950' },
  { label: 'Assignées', value: 16, tone: 'bg-[#e8ff28] text-slate-950' },
  { label: 'En transit', value: 22, tone: 'bg-blue-400 text-slate-950' },
  { label: 'Livrées', value: 98, tone: 'bg-white text-slate-950' },
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

const ActionableAlertsStrip: React.FC<{ onAlertAction: (alert: ActionableAlert, action: string) => void }> = ({ onAlertAction }) => (
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
              onClick={() => onAlertAction(alert, alert.primary)}
              className="min-h-10 rounded-lg border border-surface-border-subtle bg-surface-card px-3 py-2 text-xs font-bold shadow-sm hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
            >
              {alert.primary}
            </button>
            <button
              type="button"
              onClick={() => onAlertAction(alert, alert.secondary)}
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

const TmsControlTowerCard: React.FC<{
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  accent?: boolean;
  onClick: () => void;
}> = ({ label, value, delta, icon, accent = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-[22px] border border-white/10 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#e8ff28] focus:ring-offset-2 focus:ring-offset-[#0b0b0b] ${accent ? 'bg-[#e8ff28] text-slate-950' : 'bg-[#202020] text-white'}`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`text-xs font-semibold ${accent ? 'text-slate-700' : 'text-white/70'}`}>{label}</p>
        <p className="mt-8 text-3xl font-black tracking-normal">{value}</p>
        <p className={`mt-2 text-xs ${accent ? 'text-slate-700' : 'text-white/55'}`}>{delta}</p>
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${accent ? 'border-slate-950/20 bg-slate-950 text-[#e8ff28]' : 'border-white/10 bg-white/5 text-white'}`}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
    </div>
  </button>
);

const TmsControlTowerDashboard: React.FC<{
  openMissions: number;
  activeMissions: number;
  availableDrivers: number;
  totalDrivers: number;
  backlogRevenue: number;
  onRefresh: () => void;
  onNavigate?: (section: string, options?: { missionId?: string; driverName?: string; zone?: string }) => void;
  onMessage: (message: string) => void;
}> = ({ openMissions, activeMissions, availableDrivers, totalDrivers, backlogRevenue, onRefresh, onNavigate, onMessage }) => {
  const onTimeRate = Math.max(72, Math.min(98, MOCK_PERFORMANCE.onTimeRate + Math.round((availableDrivers / Math.max(1, totalDrivers)) * 4)));
  const driverScore = Math.max(70, Math.round(DRIVER_RANKING.reduce((sum, driver) => sum + driver.onTime, 0) / DRIVER_RANKING.length));
  const maxActivity = Math.max(...ACTIVITY_BARS.map((bar) => bar.value));
  const pendingTotal = Math.max(openMissions, CONTROL_TOWER_STATUS[0].value);

  return (
    <section className="overflow-hidden rounded-[28px] bg-[#0b0b0b] p-4 text-white shadow-2xl shadow-black/20 sm:p-5 lg:p-6">
      <div className="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]">
        <aside className="hidden rounded-[24px] border border-white/10 bg-[#151515] px-3 py-4 xl:flex xl:flex-col xl:items-center xl:justify-between">
          <div className="space-y-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8ff28] text-slate-950">
              <Icon name="truck" className="h-5 w-5" />
            </span>
            {(['dashboard', 'dispatch', 'tracking', 'drivers', 'performance'] as const).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => onNavigate?.(section === 'dashboard' ? 'dashboard' : section)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={section}
              >
                <Icon
                  name={section === 'dashboard' ? 'home' : section === 'dispatch' ? 'sparkles' : section === 'tracking' ? 'map' : section === 'drivers' ? 'users' : 'chartBar'}
                  className="h-4 w-4"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Actualiser"
          >
            <Icon name="arrow-path" className="h-4 w-4" />
          </button>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={() => onNavigate?.('missions')}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-white/10 bg-[#171717] px-4 py-3 text-left transition hover:border-white/25 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#e8ff28] focus:ring-offset-2 focus:ring-offset-[#0b0b0b]"
            >
              <Icon name="search" className="h-4 w-4 shrink-0 text-white/45" />
              <span className="truncate text-sm text-white/55">Recherche mission, chauffeur, zone, plaque...</span>
            </button>
            <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[#171717] px-4 py-3 lg:min-w-[260px]">
              <div>
                <p className="text-sm font-bold">Control Tower TMS</p>
                <p className="text-xs text-white/50">Laundry Express · Multi-services</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-black">LX</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TmsControlTowerCard label="On-time delivery" value={`${onTimeRate}%`} delta="+2% vs hier" icon="arrowRight" accent onClick={() => onNavigate?.('performance')} />
            <TmsControlTowerCard label="Missions ouvertes" value={String(openMissions)} delta={`${pendingTotal} en file terrain`} icon="shoppingBag" onClick={() => onNavigate?.('dispatch')} />
            <TmsControlTowerCard label="Chauffeurs actifs" value={`${availableDrivers}/${totalDrivers}`} delta="Disponibilité réseau" icon="users" onClick={() => onNavigate?.('drivers')} />
            <TmsControlTowerCard label="Driver behavior score" value={`${driverScore}%`} delta="Ponctualité et incidents" icon="chartBar" onClick={() => onNavigate?.('performance')} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
            <article className="rounded-[24px] border border-white/10 bg-[#202020] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Activité terrain</h2>
                  <p className="mt-1 text-xs text-white/50">{formatCdf(backlogRevenue)} en backlog à dispatcher</p>
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="rounded-full bg-white/8 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                >
                  Aujourd'hui
                </button>
              </div>
              <div className="mt-6 flex h-56 items-end gap-2 rounded-[20px] bg-black/15 px-3 pb-3 pt-6 sm:gap-3">
                {ACTIVITY_BARS.map((bar) => (
                  <div key={bar.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                    <div
                      className={`rounded-t-xl ${bar.tone === 'high' ? 'bg-[#e8ff28]' : bar.tone === 'mid' ? 'bg-white/70' : 'bg-white/25'}`}
                      style={{ height: `${Math.max(12, (bar.value / maxActivity) * 100)}%` }}
                      title={`${bar.value} missions`}
                    />
                    <span className="truncate text-center text-[10px] text-white/45">{bar.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/55">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/25" />Moins de 10 missions</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/70" />10-19 missions</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#e8ff28]" />20+ missions</span>
              </div>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-[#202020] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black">Missions</h2>
                <div className="flex gap-2 overflow-x-auto">
                  {CONTROL_TOWER_STATUS.map((status) => (
                    <span key={status.label} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${status.tone}`}>
                      {status.label} {status.value}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-5 space-y-1">
                {CONTROL_TOWER_ORDERS.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onNavigate?.('dispatch', { missionId: order.id })}
                    className="grid w-full grid-cols-[92px_minmax(0,1fr)_64px_92px] items-center gap-3 rounded-2xl px-2 py-3 text-left text-sm transition hover:bg-white/8"
                  >
                    <span className="font-mono font-bold text-white">{order.id}</span>
                    <span className="truncate text-white/68">{order.address}</span>
                    <span className="text-white/50">{order.eta}</span>
                    <span className={`justify-self-end rounded-full px-3 py-1 text-xs font-black ${
                      order.tone === 'red' ? 'bg-red-400 text-slate-950'
                        : order.tone === 'orange' ? 'bg-orange-400 text-slate-950'
                          : order.tone === 'blue' ? 'bg-blue-400 text-slate-950'
                            : order.tone === 'violet' ? 'bg-violet-400 text-white'
                              : 'bg-[#e8ff28] text-slate-950'
                    }`}>
                      {order.status}
                    </span>
                  </button>
                ))}
              </div>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-[#202020] p-5">
              <h2 className="text-lg font-black">Alertes opérationnelles</h2>
              <div className="mt-4 space-y-3">
                {ACTIONABLE_ALERTS.map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => routeAlertAction(alert, alert.primary, onNavigate, onMessage)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/8"
                  >
                    <p className="text-sm font-black">{alert.title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/55">{alert.detail}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-[#202020] p-5">
              <h2 className="text-lg font-black">Top zones</h2>
              <div className="mt-4 space-y-3">
                {TOP_ZONES.map((zone) => (
                  <button
                    key={zone.zone}
                    type="button"
                    onClick={() => onNavigate?.('dispatch', { zone: zone.zone })}
                    className="grid w-full grid-cols-[minmax(0,1fr)_64px_64px] items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-3 text-left"
                  >
                    <span className="font-bold">{zone.zone}</span>
                    <span className="text-xs text-white/55">{zone.missions} miss.</span>
                    <span className={`rounded-full px-2 py-1 text-center text-xs font-black ${
                      zone.pressure === 'stop' ? 'bg-red-400 text-slate-950'
                        : zone.pressure === 'watch' ? 'bg-orange-400 text-slate-950'
                          : 'bg-[#e8ff28] text-slate-950'
                    }`}>
                      {zone.onTime}%
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-[#202020] p-5">
              <h2 className="text-lg font-black">Top chauffeurs</h2>
              <div className="mt-4 grid gap-3">
                {DRIVER_RANKING.slice(0, 3).map((driver) => (
                  <button
                    key={driver.name}
                    type="button"
                    onClick={() => onNavigate?.('drivers', { driverName: driver.name })}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] p-3 text-left transition hover:bg-white/8"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8ff28] text-sm font-black text-slate-950">
                        {driver.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{driver.name}</span>
                        <span className="text-xs text-white/50">{driver.missions} missions</span>
                      </span>
                    </span>
                    <span className="text-sm font-black text-[#e8ff28]">{driver.onTime}%</span>
                  </button>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

type PeriodKey = 'today' | 'week' | 'month';

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

const periodDays = (period: PeriodKey) => (period === 'today' ? 1 : period === 'week' ? 7 : 30);

const isWithinPeriod = (value: string | null | undefined, period: PeriodKey) => {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (periodDays(period) - 1));
  return date >= start;
};

const percentOf = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

const OperationalSkeleton = () => (
  <div className="space-y-5">
    <div className="h-28 animate-pulse rounded-[24px] bg-surface-muted" />
    <div className="grid gap-4 md:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-[18px] bg-surface-muted" />
      ))}
    </div>
    <div className="h-[520px] animate-pulse rounded-[28px] bg-slate-900/20" />
  </div>
);

const ApiRequiredBadge = () => (
  <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-700">
    API requise
  </span>
);

type OperationalKpiCard = [string, string | number, React.ComponentProps<typeof Icon>['name']];

const OperationalControlTower: React.FC<{
  tasks: LogisticsTask[];
  drivers: LogisticsDriver[];
  alerts: ReturnType<typeof useRealTimeAlerts>['alerts'];
  mode: DataMode;
  isLoading: boolean;
  lastSync: Date | null;
  onRefresh: () => void;
  onNavigate?: LogisticsOverviewProps['onNavigate'];
  onMessage: (message: string) => void;
}> = ({ tasks, drivers, alerts, mode, isLoading, lastSync, onRefresh, onNavigate, onMessage }) => {
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<LogisticsVehicle[]>([]);
  const [maintenance, setMaintenance] = useState<LogisticsMaintenanceEvent[]>([]);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [activity, setActivity] = useState<BackendActivityLogDashboardResponse['events']>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [selectedException, setSelectedException] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSources = async () => {
    setLoadingSources(true);
    setSourceError(null);
    const failures: string[] = [];
    const [ordersResult, vehiclesResult, maintenanceResult, ticketsResult, activityResult] = await Promise.allSettled([
      realApi.getOrders({ page: 1, page_size: 250 }),
      realApi.getVehicles(),
      realApi.getMaintenanceEvents(),
      realApi.getSupportTickets(),
      realApi.getActivityLogDashboard(20),
    ]);
    if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value.orders || []);
    else failures.push('commandes');
    if (vehiclesResult.status === 'fulfilled') setVehicles(vehiclesResult.value.vehicles || []);
    else failures.push('flotte');
    if (maintenanceResult.status === 'fulfilled') setMaintenance(maintenanceResult.value.maintenance_events || []);
    else failures.push('maintenance');
    if (ticketsResult.status === 'fulfilled') setTickets(ticketsResult.value || []);
    else failures.push('support');
    if (activityResult.status === 'fulfilled') setActivity(activityResult.value.live_events?.length ? activityResult.value.live_events : activityResult.value.events || []);
    else failures.push('activity feed');
    setSourceError(failures.length ? `Sources indisponibles: ${failures.join(', ')}` : null);
    setLoadingSources(false);
  };

  useEffect(() => {
    void loadSources();
    const timer = window.setInterval(() => void loadSources(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const model = useMemo(() => {
    const periodTasks = tasks.filter((task) => isWithinPeriod(task.created_at, period) || isWithinPeriod(task.updated_at, period) || isWithinPeriod(task.completed_at, period));
    const periodOrders = orders.filter((order) => isWithinPeriod(order.created_at, period));
    const openTasks = periodTasks.filter((task) => statusIn(task.status, ['pending', 'open_market']));
    const activeTasks = periodTasks.filter((task) => statusIn(task.status, ['claimed', 'driver_assigned', 'accepted', 'in_progress']));
    const completedTasks = periodTasks.filter((task) => task.status === 'completed');
    const failedTasks = periodTasks.filter((task) => statusIn(task.status, ['failed', 'cancelled', 'expired']));
    const pickupTasks = periodTasks.filter((task) => task.task_type === 'pickup');
    const deliveryTasks = periodTasks.filter((task) => task.task_type === 'delivery');
    const pickupDone = pickupTasks.filter((task) => statusIn(task.status, ['completed', 'in_progress', 'accepted', 'driver_assigned']));
    const deliveryDone = deliveryTasks.filter((task) => task.status === 'completed');
    const paidOrders = periodOrders.filter((order) => statusIn(order.payment_status, ['paid', 'confirmed', 'completed', 'validated', 'succeeded']));
    const activeDrivers = drivers.filter((driver) => driver.status === 'active');
    const availableDrivers = activeDrivers.filter((driver) => driver.is_available);
    const openTickets = tickets.filter((ticket) => !statusIn(ticket.status, ['closed', 'resolved']));
    const overdueMaintenance = maintenance.filter((event) => statusIn(event.status, ['open', 'overdue', 'in_progress']));
    const unavailableVehicles = vehicles.filter((vehicle) => statusIn(vehicle.status, ['failed', 'cancelled', 'delayed']) || vehicle.maintenance.status === 'overdue');
    const revenue = periodOrders.reduce((sum, order) => sum + toNumber(order.total_amount), 0);
    const completionRate = percentOf(deliveryDone.length || completedTasks.length, periodOrders.length);
    const onTimeRate = percentOf(completedTasks.length, completedTasks.length + failedTasks.length);
    const avgMinutesValues = completedTasks
      .map((task) => {
        const start = parseDate(task.started_at || task.assigned_at || task.scheduled_at || task.created_at);
        const end = parseDate(task.completed_at);
        return start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : null;
      })
      .filter((value): value is number => value !== null);
    const averageMinutes = avgMinutesValues.length ? Math.round(avgMinutesValues.reduce((sum, value) => sum + value, 0) / avgMinutesValues.length) : null;
    const behaviorScore = activeDrivers.length
      ? Math.round(activeDrivers.reduce((sum, driver) => sum + Math.min(100, Math.max(0, Math.round(toNumber(driver.rating_avg) * 20))), 0) / activeDrivers.length)
      : 0;

    const zoneMap = periodTasks.reduce((map, task) => {
      const zone = task.pickup_commune || task.delivery_commune || 'Zone inconnue';
      const current = map.get(zone) || { total: 0, completed: 0, active: 0 };
      current.total += 1;
      if (task.status === 'completed') current.completed += 1;
      if (!statusIn(task.status, ['completed', 'cancelled', 'failed', 'expired'])) current.active += 1;
      map.set(zone, current);
      return map;
    }, new Map<string, { total: number; completed: number; active: number }>());

    const topZones = Array.from(zoneMap.entries())
      .map(([zone, value]) => ({ zone, missions: value.total, success: percentOf(value.completed, value.total), pressure: value.active }))
      .sort((a, b) => b.missions - a.missions)
      .slice(0, 5);

    const hourMap = periodTasks.reduce((map, task) => {
      const date = parseDate(task.created_at);
      if (!date) return map;
      const hour = `${String(date.getHours()).padStart(2, '0')}h`;
      map.set(hour, (map.get(hour) || 0) + 1);
      return map;
    }, new Map<string, number>());
    const fieldActivity = Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour.localeCompare(b.hour));

    const priorityMissions = periodTasks
      .filter((task) => !statusIn(task.status, ['completed', 'cancelled']))
      .sort((a, b) => {
        const priority = (task: LogisticsTask) => (statusIn(task.status, ['failed', 'expired']) ? 0 : statusIn(task.status, ['pending', 'open_market']) ? 1 : 2);
        return priority(a) - priority(b);
      })
      .slice(0, 7);

    const exceptions = [
      ...failedTasks.map((task) => ({
        id: `task-${task.id}`,
        type: task.status === 'expired' ? 'Collecte manquée' : 'Retard livraison',
        reference: task.order_number || task.id,
        commune: task.pickup_commune || task.delivery_commune || 'Zone inconnue',
        impact: task.status === 'failed' ? 'Mission échouée' : 'SLA dépassé',
        action: 'Ouvrir mission',
      })),
      ...openTickets.slice(0, 4).map((ticket) => ({
        id: `ticket-${ticket.id}`,
        type: 'Ticket ouvert',
        reference: ticket.id,
        commune: ticket.category || 'Support',
        impact: ticket.priority,
        action: 'Voir ticket',
      })),
      ...overdueMaintenance.slice(0, 3).map((event) => ({
        id: `maintenance-${event.id}`,
        type: 'Flotte indisponible',
        reference: event.vehicleId,
        commune: event.type,
        impact: event.status,
        action: 'Voir maintenance',
      })),
    ].slice(0, 8);

    const readyDrivers = drivers
      .filter((driver) => driver.status === 'active' && driver.is_available)
      .slice(0, 8)
      .map((driver) => ({
        id: driver.id,
        name: driver.user_name || driver.user_email || `Driver ${driver.id.slice(0, 6)}`,
        vehicle: driver.vehicle_type || 'Véhicule à confirmer',
        zone: 'Kinshasa',
        score: Math.round(toNumber(driver.rating_avg) * 20),
        eta: '--',
        occupation: driver.is_available ? 0 : 100,
      }));

    const health = [
      { label: 'Commande', status: periodOrders.length > 0 ? 'SAIN' : 'ATTENTION' },
      { label: 'Paiement', status: paidOrders.length < periodOrders.length ? 'ATTENTION' : 'SAIN' },
      { label: 'Logistique', status: failedTasks.length > 0 ? 'CRITIQUE' : 'SAIN' },
      { label: 'Support', status: openTickets.length > 0 ? 'ATTENTION' : 'SAIN' },
      { label: 'Avis', status: 'API requise' },
      { label: 'Fidélité', status: 'API requise' },
      { label: 'Promotions', status: 'API requise' },
    ];

    return {
      openTasks,
      activeTasks,
      completedTasks,
      failedTasks,
      pickupDue: pickupTasks.filter((task) => !statusIn(task.status, ['completed', 'cancelled', 'failed'])).length,
      deliveryDue: deliveryTasks.filter((task) => !statusIn(task.status, ['completed', 'cancelled', 'failed'])).length,
      paidOrders,
      pickupDone,
      deliveryDone,
      periodOrders,
      completionRate,
      onTimeRate,
      averageMinutes,
      revenue,
      activeDrivers,
      availableDrivers,
      behaviorScore,
      openTickets,
      exceptions,
      topZones,
      fieldActivity,
      priorityMissions,
      readyDrivers,
      vehicles: {
        available: vehicles.filter((vehicle) => statusIn(vehicle.status, ['pending', 'assigned']) && vehicle.maintenance.status === 'ok').length,
        inMission: vehicles.filter((vehicle) => vehicle.status === 'in_transit').length,
        maintenance: vehicles.filter((vehicle) => statusIn(vehicle.maintenance.status, ['scheduled', 'in_progress', 'overdue'])).length,
        out: unavailableVehicles.length,
        total: vehicles.length,
      },
      health,
      mapZones: topZones,
    };
  }, [tasks, drivers, orders, vehicles, maintenance, tickets, period]);

  const maxActivity = Math.max(1, ...model.fieldActivity.map((item) => item.count));
  const filteredPriority = model.priorityMissions.filter((mission) => {
    if (!searchQuery.trim()) return true;
    const haystack = [
      mission.id,
      mission.order_number,
      mission.customer_name,
      mission.pickup_commune,
      mission.delivery_commune,
      mission.pickup_address_line,
    ].join(' ').toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  if (isLoading || loadingSources) return <OperationalSkeleton />;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="rounded-[24px] border border-surface-border-subtle bg-surface-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black uppercase text-content-primary sm:text-3xl">Centre opérationnel</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${mode === 'backend' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {mode === 'backend' ? 'LIVE' : 'READ-ONLY'}
              </span>
            </div>
            <p className="mt-1 text-sm text-content-muted">Pilotage temps réel des opérations Laundry Express</p>
            {sourceError && <p className="mt-2 text-xs font-bold text-orange-700">{sourceError}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex rounded-2xl bg-surface-muted p-1">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPeriod(option.key)}
                  className={`min-h-10 rounded-xl px-4 text-sm font-black ${period === option.key ? 'bg-brand-blue text-white shadow-sm' : 'text-content-muted hover:text-content-primary'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                onRefresh();
                void loadSources();
              }}
              className="min-h-10 rounded-2xl border border-surface-border-subtle px-4 text-sm font-black text-content-primary hover:bg-surface-muted"
            >
              Actualiser
            </button>
            <span className="text-xs font-semibold text-content-muted">
              Synchro: {lastSync ? lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "À collecter aujourd'hui", value: model.pickupDue, delta: 'backend', icon: 'shoppingBag' as const, tone: 'bg-blue-50 text-brand-blue', target: 'dispatch' },
          { label: "À livrer aujourd'hui", value: model.deliveryDue, delta: 'backend', icon: 'truck' as const, tone: 'bg-green-50 text-green-600', target: 'missions' },
          { label: 'Retards critiques', value: model.failedTasks.length, delta: 'backend', icon: 'clock' as const, tone: 'bg-orange-50 text-orange-600', target: 'alerts' },
          { label: 'Anomalies ouvertes', value: model.exceptions.length, delta: 'backend', icon: 'warning' as const, tone: 'bg-red-50 text-red-600', target: 'alerts' },
          { label: 'Tickets ouverts', value: model.openTickets.length, delta: 'backend', icon: 'chatBubble' as const, tone: 'bg-purple-50 text-purple-600', target: 'reports' },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate?.(card.target)}
            className={`${logisticsCard} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${card.tone}`}>
                <Icon name={card.icon} className="h-6 w-6" />
              </span>
              <Icon name="arrowRight" className="h-4 w-4 text-content-muted" />
            </div>
            <p className="mt-4 text-sm font-bold text-content-muted">{card.label}</p>
            <p className="mt-1 text-3xl font-black text-content-primary">{card.value}</p>
            <p className="mt-1 text-xs font-bold text-content-muted">{card.delta}</p>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-[28px] bg-[#0b0f16] p-4 text-white shadow-2xl shadow-black/20 sm:p-5 lg:p-6">
        <div className="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]">
          <aside className="hidden rounded-[24px] border border-white/10 bg-white/[0.03] px-3 py-4 xl:flex xl:flex-col xl:items-center xl:justify-between">
            <div className="space-y-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue text-white">
                <Icon name="truck" className="h-5 w-5" />
              </span>
              {(['dashboard', 'dispatch', 'tracking', 'drivers', 'maintenance'] as const).map((section) => (
                <button key={section} type="button" onClick={() => onNavigate?.(section)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/60 hover:bg-white/10 hover:text-white" aria-label={section}>
                  <Icon name={section === 'dashboard' ? 'home' : section === 'dispatch' ? 'shoppingBag' : section === 'tracking' ? 'map' : section === 'drivers' ? 'users' : 'settings'} className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button type="button" onClick={onRefresh} className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/60 hover:bg-white/10 hover:text-white" aria-label="Actualiser">
              <Icon name="arrow-path" className="h-4 w-4" />
            </button>
          </aside>

          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
              <label className="relative">
                <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher mission, chauffeur, zone, plaque..."
                  className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-blue"
                />
              </label>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-sm font-black">Control Tower TMS</p>
                <p className="text-xs text-white/45">Backend connecté · Actions sensibles read-only</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['On-time delivery', `${model.onTimeRate}%`, 'Ponctualité calculée'],
                ['Missions ouvertes', String(model.openTasks.length), 'À assigner'],
                ['Chauffeurs actifs', `${model.activeDrivers.length}/${drivers.length}`, 'Disponibilité réseau'],
                ['Driver behavior score', `${model.behaviorScore}%`, 'Basé sur rating backend'],
              ].map(([label, value, detail], index) => (
                <article key={label} className={`rounded-[22px] border border-white/10 p-5 ${index === 0 ? 'bg-brand-blue text-white' : 'bg-white/[0.05]'}`}>
                  <p className="text-xs font-bold text-white/70">{label}</p>
                  <p className="mt-6 text-3xl font-black">{value}</p>
                  <p className="mt-2 text-xs text-white/55">{detail}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
              <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-lg font-black">Activité terrain</h2>
                {model.fieldActivity.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-white/55">Aucune activité backend sur cette période.</div>
                ) : (
                  <div className="mt-6 flex h-56 items-end gap-2 rounded-[20px] bg-black/20 px-3 pb-3 pt-6">
                    {model.fieldActivity.map((bar) => (
                      <div key={bar.hour} className="flex h-full flex-1 flex-col justify-end gap-2">
                        <div className={`rounded-t-xl ${bar.count >= 20 ? 'bg-green-400' : bar.count >= 10 ? 'bg-blue-400' : 'bg-white/40'}`} style={{ height: `${Math.max(10, (bar.count / maxActivity) * 100)}%` }} />
                        <span className="text-center text-[10px] text-white/45">{bar.hour}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-lg font-black">Missions prioritaires</h2>
                <div className="mt-4 space-y-2">
                  {filteredPriority.length === 0 ? (
                    <p className="rounded-2xl bg-black/20 p-5 text-sm text-white/55">Aucune mission prioritaire backend.</p>
                  ) : filteredPriority.map((mission) => (
                    <button key={mission.id} type="button" onClick={() => onNavigate?.('dispatch', { missionId: mission.id })} className="grid w-full grid-cols-[88px_minmax(0,1fr)_88px] items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm hover:bg-white/10">
                      <span className="font-mono font-black">{mission.order_number || mission.id}</span>
                      <span className="truncate text-white/65">{mission.pickup_address_line || mission.pickup_commune || 'Adresse à confirmer'}</span>
                      <span className={`justify-self-end rounded-full px-2 py-1 text-[11px] font-black ${mission.status === 'completed' ? 'bg-green-400 text-slate-950' : statusIn(mission.status, ['failed', 'expired']) ? 'bg-red-400 text-white' : 'bg-blue-400 text-slate-950'}`}>{mission.status}</span>
                    </button>
                  ))}
                </div>
              </article>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-lg font-black">Alertes compactes</h2>
                <div className="mt-4 space-y-3">
                  {alerts.length === 0 ? <p className="text-sm text-white/55">Aucune alerte active.</p> : alerts.slice(0, 5).map((alert) => (
                    <button key={alert.id} type="button" onClick={() => onNavigate?.('alerts')} className="w-full rounded-2xl bg-black/20 p-3 text-left hover:bg-white/10">
                      <p className="text-sm font-black">{alert.title}</p>
                      <p className="mt-1 text-xs text-white/50">{alert.description}</p>
                    </button>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-lg font-black">Top zones</h2>
                <div className="mt-4 space-y-3">
                  {model.topZones.length === 0 ? <p className="text-sm text-white/55">Aucune zone calculable.</p> : model.topZones.map((zone) => (
                    <button key={zone.zone} type="button" onClick={() => onNavigate?.('dispatch', { zone: zone.zone })} className="grid w-full grid-cols-[1fr_64px_64px] items-center gap-3 rounded-2xl bg-black/20 px-3 py-3 text-left">
                      <span className="font-bold">{zone.zone}</span>
                      <span className="text-xs text-white/55">{zone.missions} miss.</span>
                      <span className={`rounded-full px-2 py-1 text-center text-xs font-black ${zone.success >= 90 ? 'bg-green-400 text-slate-950' : zone.success >= 70 ? 'bg-orange-400 text-slate-950' : 'bg-red-400 text-white'}`}>{zone.success}%</span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-lg font-black">Chauffeurs prêts</h2>
                <div className="mt-4 space-y-3">
                  {model.readyDrivers.length === 0 ? <p className="text-sm text-white/55">Aucun chauffeur disponible.</p> : model.readyDrivers.slice(0, 5).map((driver) => (
                    <button key={driver.id} type="button" onClick={() => onNavigate?.('drivers', { driverName: driver.name })} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-black/20 p-3 text-left hover:bg-white/10">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{driver.name}</span>
                        <span className="text-xs text-white/50">{driver.vehicle} · {driver.zone}</span>
                      </span>
                      <span className="text-sm font-black text-green-300">{driver.score}%</span>
                    </button>
                  ))}
                </div>
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-lg font-black">Corridor de vérité — Commandes</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {[
                    ['Commandes créées', model.periodOrders.length],
                    ['Paiements validés', model.paidOrders.length],
                    ['Collectes effectuées', model.pickupDone.length],
                    ['Livraisons réalisées', model.deliveryDone.length || model.completedTasks.length],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold text-white/55">{label}</p>
                      <p className="mt-2 text-3xl font-black text-blue-300">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm font-black"><span>Taux de conversion global</span><span>{model.completionRate}%</span></div>
                  <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.min(100, model.completionRate)}%` }} /></div>
                </div>
              </article>

              <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-lg font-black">Alertes & exceptions</h2>
                <div className="mt-4 space-y-2">
                  {model.exceptions.length === 0 ? <p className="rounded-2xl bg-black/20 p-4 text-sm text-white/55">Aucune exception backend.</p> : model.exceptions.map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedException(item.id)} className="grid w-full grid-cols-[minmax(0,1fr)_72px] gap-3 rounded-2xl bg-black/20 p-3 text-left hover:bg-white/10">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{item.type}</span>
                        <span className="text-xs text-white/50">{item.reference} · {item.commune}</span>
                      </span>
                      <span className="text-right text-xs font-black text-orange-300">{item.impact}</span>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {([
          ['Missions complétées', model.completedTasks.length, 'check' as const],
          ['Temps moyen global', model.averageMinutes === null ? '--' : `${model.averageMinutes} min`, 'clock' as const],
          ['Revenu total', formatCdf(model.revenue), 'currencyDollar' as const],
          ['Ponctualité', `${model.onTimeRate}%`, 'hand-thumb-up' as const],
        ] satisfies OperationalKpiCard[]).map(([label, value, icon]) => (
          <article key={label} className={`${logisticsCard} p-5`}>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"><Icon name={icon} className="h-6 w-6" /></span>
              <div><p className="text-sm font-bold text-content-muted">{label}</p><p className="text-2xl font-black text-content-primary">{value}</p></div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${logisticsCard} p-5`}>
          <h3 className="font-black text-content-primary">État des corridors de vérité</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {model.health.map((item) => (
              <div key={item.label} className="rounded-2xl border border-surface-border-subtle p-3">
                <p className="text-xs font-black text-content-muted">{item.label}</p>
                <p className={`mt-2 text-xs font-black ${item.status === 'SAIN' ? 'text-green-600' : item.status === 'CRITIQUE' ? 'text-red-600' : 'text-orange-600'}`}>{item.status}</p>
              </div>
            ))}
          </div>
        </article>
        <article className={`${logisticsCard} p-5`}>
          <h3 className="font-black text-content-primary">État flotte</h3>
          <div className="mt-4 space-y-2 text-sm">
            {[
              ['Disponibles', model.vehicles.available],
              ['En mission', model.vehicles.inMission],
              ['Maintenance', model.vehicles.maintenance],
              ['Hors service', model.vehicles.out],
              ['Total', model.vehicles.total],
            ].map(([label, value]) => <div key={label} className="flex justify-between border-b border-surface-border-subtle pb-2"><span>{label}</span><b>{value}</b></div>)}
          </div>
        </article>
        <article className={`${logisticsCard} p-5`}>
          <h3 className="font-black text-content-primary">Activity feed</h3>
          <div className="mt-4 space-y-2">
            {activity.length === 0 ? <p className="text-sm text-content-muted">Aucun événement backend récent.</p> : activity.slice(0, 6).map((event) => (
              <div key={event.id} className="rounded-xl bg-surface-muted p-3 text-sm">
                <p className="font-black text-content-primary">{event.action_label || event.action}</p>
                <p className="text-xs text-content-muted">{event.reference || event.resource_id} · {event.occurred_at ? new Date(event.occurred_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={`${logisticsCard} p-5`}>
        <h3 className="font-black text-content-primary">Actions rapides</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['Voir anomalies', 'alerts'],
            ['Commandes bloquées', 'missions'],
            ['Tickets ouverts', 'reports'],
            ['Paiements échoués', 'reports'],
            ['Exporter rapport', 'reports'],
          ].map(([label, target]) => (
            <button key={label} type="button" onClick={() => onNavigate?.(target)} className="min-h-11 rounded-xl border border-surface-border-subtle px-4 text-sm font-black text-content-primary hover:bg-surface-muted">
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <article className={`${logisticsCard} p-5`}>
          <h3 className="font-black text-content-primary">Backlog à dispatcher</h3>
          <div className="mt-4 space-y-2">
            {model.openTasks.length === 0 ? <p className="rounded-2xl bg-surface-muted p-8 text-center text-sm text-content-muted">Aucune mission à dispatcher.</p> : model.openTasks.slice(0, 6).map((task) => (
              <button key={task.id} type="button" onClick={() => onNavigate?.('dispatch', { missionId: task.id })} className="grid w-full grid-cols-[1fr_80px] gap-3 rounded-xl border border-surface-border-subtle p-3 text-left hover:bg-surface-muted">
                <span><b className="block text-content-primary">{task.order_number || task.id}</b><span className="text-xs text-content-muted">{task.customer_name || 'Client'} · {task.pickup_commune || 'Zone'}</span></span>
                <span className="text-right text-xs font-black text-brand-blue">{task.task_type}</span>
              </button>
            ))}
          </div>
        </article>

        <article className={`${logisticsCard} p-5`}>
          <h3 className="font-black text-content-primary">Carte de dispatch</h3>
          <div className="relative mt-4 h-72 overflow-hidden rounded-2xl bg-slate-100">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,.18)_1px,transparent_1px),linear-gradient(rgba(148,163,184,.18)_1px,transparent_1px)] bg-[size:32px_32px]" />
            {model.mapZones.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-content-muted">Données carte backend indisponibles.</div>
            ) : model.mapZones.slice(0, 6).map((zone, index) => (
              <button key={zone.zone} type="button" onClick={() => onNavigate?.('dispatch', { zone: zone.zone })} className={`absolute flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white shadow-lg ${zone.success >= 90 ? 'bg-green-500' : zone.success >= 70 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ left: `${18 + (index * 17) % 68}%`, top: `${22 + (index * 19) % 58}%` }}>
                {zone.zone.slice(0, 2)}
              </button>
            ))}
            <span className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-black text-brand-blue">{model.activeTasks.length} actifs</span>
            <span className="absolute bottom-4 left-28 rounded-full bg-white px-3 py-1 text-xs font-black text-orange-600">{model.openTasks.length} en attente</span>
          </div>
        </article>

        <article className={`${logisticsCard} p-5`}>
          <h3 className="flex items-center justify-between font-black text-content-primary">Alertes opérationnelles <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">{alerts.length} alertes</span></h3>
          <div className="mt-4 space-y-3">
            {alerts.length === 0 ? <p className="text-sm text-content-muted">Aucune alerte opérationnelle.</p> : alerts.slice(0, 5).map((alert) => (
              <button key={alert.id} type="button" onClick={() => onNavigate?.('alerts')} className="w-full rounded-2xl border border-surface-border-subtle p-3 text-left hover:bg-surface-muted">
                <p className="text-sm font-black text-content-primary">{alert.title}</p>
                <p className="text-xs text-content-muted">{alert.timestamp}</p>
              </button>
            ))}
          </div>
        </article>
      </section>

      {selectedException && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-content-primary">Détail exception</h3>
                <p className="text-sm text-content-muted">{selectedException}</p>
              </div>
              <button type="button" onClick={() => setSelectedException(null)} className="rounded-xl p-2 text-content-muted hover:bg-surface-muted">
                <Icon name="xmark" className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              Détail complet et résolution nécessitent les endpoints opérationnels dédiés. <ApiRequiredBadge />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const LogisticsOverview: React.FC<LogisticsOverviewProps> = ({ onRefresh, onAutoDispatch, onExport, onNavigate, onActionFeedback }) => {
  const [activeTab, setActiveTab] = useState<DispatcherTab>('operations');
  const { alerts, criticalCount, refresh: refreshAlerts } = useRealTimeAlerts();
  const { data: liveTracking, isLoading: isLiveTrackingLoading, mode: liveTrackingMode, refresh: refreshLiveTracking } = useRealTimeTracking();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [backlog, setBacklog] = useState<LogisticsBacklogMission[]>(MOCK_BACKLOG);
  const [activeMissions, setActiveMissions] = useState<LogisticsMissionRow[]>(MOCK_ACTIVE_MISSIONS);
  const [readyDrivers, setReadyDrivers] = useState<LogisticsReadyDriver[]>(MOCK_READY_DRIVERS);
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

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getMissionRows(MOCK_BACKLOG, MOCK_ACTIVE_MISSIONS),
      getLogisticsDrivers([]),
    ]).then(([missionResult, driverResult]) => {
      if (!mounted) return;
      setBacklog(missionResult.data.backlog);
      setActiveMissions(missionResult.data.missions);
      if (driverResult.data.length > 0) {
        setReadyDrivers(driverResult.data.map(driverProfileToReadyDriver));
      }
      setDataMode(missionResult.mode === 'backend' || driverResult.mode === 'backend' ? 'backend' : 'degraded');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const liveOpenMissionsCount = liveTrackingMode === 'backend' && liveTracking.tasks.length > 0
    ? liveTracking.tasks.filter((task) => task.status === 'pending' || task.status === 'open_market').length
    : backlog.length;
  const liveActiveMissionsCount = liveTrackingMode === 'backend' && liveTracking.tasks.length > 0
    ? liveTracking.tasks.filter((task) => ['driver_assigned', 'accepted', 'in_progress'].includes(task.status)).length
    : activeMissions.length;
  const liveTotalMissionFlow = liveOpenMissionsCount + liveActiveMissionsCount;
  const liveActiveMissionRate = liveTotalMissionFlow > 0 ? Math.round((liveActiveMissionsCount / liveTotalMissionFlow) * 100) : 0;
  const liveTotalDriversCount = liveTrackingMode === 'backend' && liveTracking.drivers.length > 0
    ? liveTracking.drivers.length
    : readyDrivers.length;
  const liveAvailableDriversCount = liveTrackingMode === 'backend' && liveTracking.drivers.length > 0
    ? liveTracking.drivers.filter((driver) => driver.is_available).length
    : readyDrivers.filter((driver) => driver.status === 'Disponible').length;
  const liveEstimatedBacklogRevenue = backlog.reduce((total, mission) => total + mission.amount, 0);

  const urgentMissionsForMobile = useMemo(() => {
    const delayAlerts = alerts.filter((alert) => alert.type === 'retard' || alert.type === 'attente');
    if (delayAlerts.length > 0) {
      return delayAlerts.map((alert, index) => ({
        id: alert.id || `alert-${index}`,
        customerName: alert.title.replace(/^Mission /, '').replace(/ en retard$/, ''),
        pickupZone: alert.description.split('·')[1]?.trim() || alert.description,
        deliveryZone: alert.description.split('·')[0]?.trim() || 'Kinshasa',
        queueMinutes: Number.parseInt(alert.timestamp, 10) || 15,
        priority: (alert.severity === 'high' ? 'urgent' : 'high') as 'urgent' | 'high',
        status: 'pending',
      }));
    }
    return backlog
      .filter((mission) => mission.amount > 3000)
      .map((mission) => ({
        id: mission.id,
        customerName: mission.client,
        pickupZone: mission.commune,
        deliveryZone: mission.delivery.split(',')[0],
        queueMinutes: 15,
        priority: 'urgent' as const,
        status: 'pending',
      }));
  }, [alerts, backlog]);

  const pendingCountForMobile = alerts.find((alert) => alert.id === 'pending-missions')?.count ?? liveOpenMissionsCount;

  const liveKpiCards = [
    { label: 'Missions ouvertes', value: String(liveOpenMissionsCount), sub: 'À assigner', icon: 'shoppingBag' as const, tone: 'bg-blue-50 text-brand-blue' },
    { label: 'Missions actives', value: String(liveActiveMissionsCount), sub: `${liveActiveMissionRate}% du flux`, icon: 'truck' as const, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Chauffeurs dispo', value: `${liveAvailableDriversCount}/${liveTotalDriversCount}`, sub: 'Réseau actif', icon: 'users' as const, tone: 'bg-green-50 text-green-600' },
    { label: 'Volume estimé', value: formatCdf(liveEstimatedBacklogRevenue), sub: 'Backlog non assigné', icon: 'currencyDollar' as const, tone: 'bg-orange-50 text-orange-600' },
  ];

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
    void refreshAlerts();
    void refreshLiveTracking();
    onRefresh();
    announceAction(`Section ${TABS.find((tab) => tab.key === activeTab)?.label || 'active'} rafraîchie.${criticalCount > 0 ? ` ${criticalCount} alerte(s) critique(s).` : ''}`);
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
            {/* Mobile: Urgency-focused view */}
            <div className="sm:hidden">
              <DispatcherMobileUrgency
                urgentMissions={urgentMissionsForMobile}
                totalPending={pendingCountForMobile}
                onSelectMission={(id) => announceAction(`Mission ${id} sélectionnée`)}
                onAssignMission={(id) => announceAction(`Assignation de ${id} en cours`)}
              />
            </div>

            {/* Desktop: Full operations view */}
            <div className="hidden sm:block">
              <ActionableAlertsStrip
                onAlertAction={(alert, action) => routeAlertAction(alert, action, onNavigate, announceAction)}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
              <div className={`${logisticsCard} p-5`}>
                <BacklogBoard
                  missions={backlog}
                  onMissionClick={(missionId) => {
                    const mission = backlog.find((item) => item.id === missionId);
                    if (mission) {
                      storeBacklogMissionForDispatch(mission);
                    }
                    sessionStorage.setItem('logisticsFocusMissionId', missionId);
                    onNavigate?.('dispatch', { missionId });
                    onActionFeedback?.(`Ouverture du dispatch pour ${missionId}.`);
                  }}
                />
              </div>
              <div className={`${logisticsCard} p-5`}>
                <ReadyDriversPanel drivers={readyDrivers} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            <MissionTable missions={activeMissions} />
          </div>
        );
      case 'drivers':
        return (
          <div className={`${logisticsCard} p-5`}>
            <DriversTable drivers={readyDrivers} />
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <div className={`${logisticsCard} p-5`}>
              <PerformanceDashboard data={MOCK_PERFORMANCE} />
            </div>
            <DriverLeaderboard
              onDriverAction={(label) => {
                const driverName = label.split(' - ')[1];
                if (driverName) {
                  onNavigate?.('drivers', { driverName });
                  announceAction(`Ouverture du profil chauffeur ${driverName}.`);
                } else {
                  onNavigate?.('performance');
                  announceAction(`Ouverture performance chauffeur : ${label}.`);
                }
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div role="status" className="rounded-2xl border border-brand-blue/20 bg-blue-50 px-5 py-3 text-sm font-bold text-brand-blue">
          {actionMessage}
        </div>
      )}
      <OperationalControlTower
        tasks={liveTracking.tasks}
        drivers={liveTracking.drivers}
        alerts={alerts}
        mode={liveTrackingMode === 'backend' || dataMode === 'backend' ? 'backend' : 'degraded'}
        isLoading={isLiveTrackingLoading}
        lastSync={liveTracking.lastSync}
        onRefresh={handleRefresh}
        onNavigate={onNavigate}
        onMessage={(message) => announceAction(message)}
      />
    </div>
  );
};
