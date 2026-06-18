import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveGreetingName } from '../lib/display-name';
import { ChatModal } from '../components/ChatModal';
import { Icon } from '../components/Icon';
import { NotificationBell } from '../components/NotificationBell';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { MobileBottomNav, type MobileNavItem } from '../components/ui/MobileBottomNav';
import { BottomSheet } from '../components/ui/BottomSheet';
import { DriverKpiCards } from '../components/driver/DriverKpiCards';
import { ActiveMissionCard as DriverActiveMissionCard } from '../components/driver/ActiveMissionCard';
import { DriverAvailabilityToggle } from '../components/driver/DriverAvailabilityToggle';
import { DriverMissionScreen } from '../components/driver/DriverMissionScreen';
import { DriverMobileDashboard } from '../components/driver/DriverMobileDashboard';
import { DeliveryProofSheet } from '../components/driver/DeliveryProofSheet';
import { useAppContext } from '../context/AppContext';
import { useMyReferralStats } from '../hooks/useMyReferralStats';
import { LogisticsDriver, LogisticsTask, realApi } from '../services/real-api';
import { NotificationPreferences, Order, OrderStatus, User } from '../types';
import {
  clearMissionSubPhase,
  getMissionSubPhase,
  setMissionSubPhase as persistMissionSubPhase,
  type MissionSubPhase,
} from '../lib/driver-mission-phase';
import {
  pilotTrackAssignment,
  pilotTrackDelivery,
  pilotTrackIncident,
  pilotTrackMissionStart,
  pilotTrackPickup,
} from '../lib/pilot-metrics-store';

type DriverSection =
  | 'dashboard'
  | 'missions'
  | 'history'
  | 'earnings'
  | 'availability'
  | 'documents'
  | 'support'
  | 'settings'
  | 'referral';

const DRIVER_SECTIONS: DriverSection[] = [
  'dashboard',
  'missions',
  'history',
  'earnings',
  'availability',
  'documents',
  'support',
  'settings',
  'referral',
];

const isDriverSection = (value: string): value is DriverSection =>
  DRIVER_SECTIONS.includes(value as DriverSection);

const SECTION_LABELS: Record<DriverSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Tableau de bord chauffeur',
    subtitle: 'Aperçu de votre activité et missions du jour.',
  },
  missions: {
    title: 'Missions',
    subtitle: 'Mission active, propositions et actions opérationnelles.',
  },
  history: {
    title: 'Historique',
    subtitle: 'Toutes vos missions terminées, annulées ou échouées.',
  },
  earnings: {
    title: 'Gains',
    subtitle: 'Relevé détaillé et export de vos revenus estimés.',
  },
  availability: {
    title: 'Disponibilité',
    subtitle: 'Statut en ligne et créneaux préférés.',
  },
  documents: {
    title: 'Documents',
    subtitle: 'Pièces d’identité et conformité chauffeur.',
  },
  support: {
    title: 'Support',
    subtitle: 'Contactez le dispatch ou le centre d’aide.',
  },
  settings: {
    title: 'Paramètres',
    subtitle: 'Notifications et préférences du compte.',
  },
  referral: {
    title: 'Parrainage chauffeur',
    subtitle: 'Invitez un collègue et gagnez 5 % sur ses missions.',
  },
};

type EarningsBreakdown = {
  base: number;
  bonus: number;
  tips: number;
  other: number;
};

type DriverStats = {
  completedToday: number;
  totalEstimatedEarnings: number;
  weeklyEarnings: number;
  weeklyMissionCount: number;
  acceptanceRate: number;
  acceptedMissions: number;
  offeredMissions: number;
};

type MissionChartPoint = {
  label: string;
  completed: number;
  cancelled: number;
  rejected: number;
};

const DRIVER_IMAGE = '/images/driver/driver-scooter.svg';
const REFERRAL_IMAGE = '/images/driver/referral-earnings.svg';
const MONEY_PER_MISSION = 2;
const driverCard = 'rounded-2xl border border-surface-border-subtle bg-surface-card shadow-card';

const safeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatMoney = (value: number) => `${safeNumber(value).toFixed(2)} $`;

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const getTaskStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    open_market: 'Disponible',
    claimed: 'Réservée',
    driver_assigned: 'Assignée',
    accepted: 'Acceptée',
    in_progress: 'En cours',
    completed: 'Terminée',
    failed: 'Échec',
    cancelled: 'Annulée',
    expired: 'Expirée',
  };
  return labels[status || ''] || 'Bientôt disponible';
};

const getTaskClientName = (task?: LogisticsTask | null) =>
  task?.customer_name || task?.pickup_contact_name || task?.partner_name || 'Client Laundry Express';

const getTaskPhone = (task?: LogisticsTask | null) =>
  task?.customer_phone || task?.pickup_contact_phone || '+243 81 234 5678';

const getTaskPickupAddress = (task?: LogisticsTask | null) =>
  [task?.pickup_address_label || task?.pickup_address_line, task?.pickup_commune].filter(Boolean).join(', ') || 'Adresse de départ bientôt disponible';

const getTaskDeliveryAddress = (task?: LogisticsTask | null) =>
  [task?.delivery_address_label || task?.delivery_address_line, task?.delivery_commune].filter(Boolean).join(', ') || 'Adresse d’arrivée bientôt disponible';

const buildOrderFromTask = (task: LogisticsTask): Order => ({
  id: task.order_id || task.id,
  userId: '',
  partner: null,
  serviceItems: [],
  clientDetails: {
    name: getTaskClientName(task),
    phone: getTaskPhone(task),
    pickupAddress: {
      commune: task.pickup_commune || task.delivery_commune || '',
      avenue: task.pickup_address_line || task.pickup_address_label || task.delivery_address_line || task.delivery_address_label || '',
      numero: '',
    },
  },
  pickupTime: '',
  status: task.task_type === 'pickup' ? OrderStatus.PICKUP : OrderStatus.DELIVERY,
  trackingHistory: [],
  totalPrice: 0,
  createdAt: task.created_at,
});

const DriverSidebar: React.FC<{
  activeSection: DriverSection;
  onSectionChange: (section: DriverSection) => void;
  onNavigate: (page: { name: 'home' }) => void;
  onLogout: () => void;
  mobile?: boolean;
}> = ({ activeSection, onSectionChange, onNavigate, onLogout, mobile = false }) => {
  const items: { section: DriverSection; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { section: 'dashboard', label: 'Tableau de bord', icon: 'home' },
    { section: 'missions', label: 'Missions', icon: 'shoppingBag' },
    { section: 'history', label: 'Historique', icon: 'clock' },
    { section: 'earnings', label: 'Gains', icon: 'currencyDollar' },
    { section: 'availability', label: 'Disponibilité', icon: 'circle' },
    { section: 'documents', label: 'Documents', icon: 'document-text' },
    { section: 'support', label: 'Support', icon: 'lifebuoy' },
    { section: 'settings', label: 'Paramètres', icon: 'settings' },
  ];

  return (
    <aside
      className={`${
        mobile ? 'flex h-full w-full' : 'hidden md:flex fixed inset-y-0 left-0 z-50 w-[260px]'
      } flex-col border-r border-surface-border bg-surface-card px-4 py-5`}
    >
      <button
        type="button"
        onClick={() => onNavigate({ name: 'home' })}
        className="mb-6 flex shrink-0 items-center gap-3 px-2 text-left"
        aria-label="Retour à l’accueil"
      >
        <Icon name="logo" className="h-9 w-9 text-brand-blue" />
        <span className="text-xl font-black text-content-primary">Laundry Express</span>
      </button>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" aria-label="Navigation chauffeur">
        {items.map((item) => {
          const active = activeSection === item.section;
          return (
            <button
              key={item.section}
              type="button"
              onClick={() => onSectionChange(item.section)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                active ? 'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/20' : 'text-content-muted hover:bg-surface-muted'
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 shrink-0 space-y-3">
        <div className={`flex items-center justify-between rounded-xl border border-surface-border-subtle px-4 py-3 ${mobile ? '' : 'hidden md:flex'}`}>
          <span className="text-xs font-bold text-content-muted">Thème</span>
          <ThemeSwitcher />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-surface-border-subtle px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <Icon name="arrowRight" className="h-5 w-5" />
          Déconnexion
        </button>
        <DriverReferralCard onOpen={() => onSectionChange('referral')} />
      </div>
    </aside>
  );
};

const DriverReferralCard: React.FC<{ className?: string; onOpen: () => void }> = ({ className = '', onOpen }) => (
  <section className={`rounded-2xl border border-surface-border-subtle bg-gradient-to-br from-blue-500/10 to-surface-card p-4 shadow-sm ${className}`}>
    <h3 className="text-sm font-black text-brand-blue">Parrainez un chauffeur</h3>
    <p className="mt-2 text-xs text-content-muted">Gagnez 5% de chaque mission</p>
    <img src={REFERRAL_IMAGE} alt="Sac de pièces et progression de gains Laundry Express" className="mx-auto my-4 h-24 w-full object-contain" />
    <button
      type="button"
      onClick={() => {
        onOpen();
        window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_referral_clicked' } }));
      }}
      className="w-full rounded-xl border border-brand-blue px-4 py-2 text-sm font-black text-brand-blue transition hover:bg-brand-blue hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/30"
    >
      Inviter maintenant
    </button>
  </section>
);

const DriverTopbar: React.FC<{
  driverName: string;
  avatarUrl?: string;
  onMenuClick: () => void;
}> = ({ driverName, avatarUrl, onMenuClick }) => (
  <header className="fixed inset-x-0 top-0 z-40 flex h-[72px] items-center justify-between border-b border-surface-border bg-surface-card/95 px-4 backdrop-blur md:hidden">
    <button
      type="button"
      onClick={onMenuClick}
      className="rounded-xl p-2 text-content-muted hover:bg-surface-muted"
      aria-label="Ouvrir le menu chauffeur"
    >
      <Icon name="bars3" className="h-6 w-6" />
    </button>
    <div className="flex items-center gap-2 sm:gap-3">
      <ThemeSwitcher />
      <NotificationBell />
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`Avatar de ${driverName}`} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-sm font-black text-white">
            {driverName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden text-sm text-content-primary sm:inline">Bonjour, {driverName}</span>
      </div>
    </div>
  </header>
);

const DriverDesktopBar: React.FC<{ driverName: string }> = ({ driverName }) => (
  <div className="sticky top-0 z-30 mb-4 hidden items-center justify-between gap-3 rounded-2xl border border-surface-border-subtle bg-surface-card/95 px-4 py-3 backdrop-blur md:flex">
    <p className="text-sm text-content-muted">
      Bonjour, <span className="font-black text-content-primary">{driverName}</span>
    </p>
    <NotificationBell />
  </div>
);

// DriverKpiCards is now imported from components/driver/DriverKpiCards

export const DriverStatusCard: React.FC<{
  available: boolean;
  isUpdating: boolean;
  onToggle: () => void;
}> = ({ available, isUpdating, onToggle }) => (
  <section className={`${driverCard} relative overflow-hidden p-6`}>
    <div className="grid gap-6 md:grid-cols-[1fr_260px] md:items-center">
      <div>
        <h2 className="text-base font-black text-content-primary">Mon statut</h2>
        <div className="mt-6 flex items-center gap-3">
          <span className={`h-4 w-4 rounded-full ${available ? 'bg-green-500' : 'bg-slate-300'} ring-4 ${available ? 'ring-green-100' : 'ring-slate-100'}`} />
          <p className={`text-2xl font-black ${available ? 'text-green-600' : 'text-slate-500'}`}>
            {available ? 'Disponible' : 'Indisponible'}
          </p>
        </div>
        <p className="mt-3 max-w-xl text-sm text-content-muted">
          {available ? 'Vous êtes disponible pour recevoir de nouvelles missions.' : "Vous n’êtes pas disponible pour recevoir des missions."}
        </p>
        <button
          onClick={onToggle}
          disabled={isUpdating}
          aria-label={available ? 'Passer indisponible' : 'Devenir disponible'}
          className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white shadow-lg transition focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-60 ${
            available ? 'bg-slate-800 hover:bg-slate-700' : 'bg-brand-blue hover:bg-brand-blue-700'
          }`}
        >
          {isUpdating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Icon name={available ? 'xmark' : 'check'} className="h-4 w-4" />}
          {available ? 'Passer indisponible' : 'Devenir disponible'}
        </button>
      </div>
      <img src={DRIVER_IMAGE} alt="Chauffeur Laundry Express en scooter bleu" className="mx-auto h-44 w-full max-w-[260px] object-contain" />
    </div>
  </section>
);

const DriverTipsCard: React.FC<{ acceptanceRate: number; accepted: number; offered: number }> = ({ acceptanceRate, accepted, offered }) => {
  const pct = Math.max(0, Math.min(100, safeNumber(acceptanceRate)));
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <section className={`${driverCard} border-blue-500/20 bg-blue-500/10 p-6`}>
      <div className="grid gap-6 md:grid-cols-[1fr_180px] md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <Icon name="sparkles" className="h-6 w-6 text-brand-blue" />
            <h2 className="font-black text-brand-blue">Astuces pour recevoir plus de missions</h2>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-content-primary">
            {[
              'Rendez-vous disponible pendant les heures de pointe',
              'Maintenez un taux d’acceptation élevé',
              'Respectez les délais de livraison',
              'Gardez votre note au-dessus de 4.5',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <Icon name="check" className="mt-0.5 h-4 w-4 rounded-full bg-surface-card text-brand-blue" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-center">
          <svg viewBox="0 0 110 110" className="mx-auto h-28 w-28" aria-label={`Taux d’acceptation ${pct}%`}>
            <circle cx="55" cy="55" r="44" fill="none" stroke="#dbe7fb" strokeWidth="10" />
            <circle cx="55" cy="55" r="44" fill="none" stroke="#0066CC" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 55 55)" />
            <text x="55" y="61" textAnchor="middle" className="fill-brand-blue text-2xl font-black">{pct}%</text>
          </svg>
          <p className="mt-2 text-sm font-black text-content-primary">Taux d’acceptation</p>
          <p className="text-sm text-content-muted">{accepted} / {offered} missions</p>
        </div>
      </div>
    </section>
  );
};

// ActiveMissionCard is now imported from components/driver/ActiveMissionCard as DriverActiveMissionCard

const MissionInfo: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl bg-surface-muted p-4">
    <div className="flex items-center gap-2 text-xs font-black uppercase text-content-muted">
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </div>
    <p className="mt-2 text-sm font-bold text-content-primary">{value || 'Bientôt disponible'}</p>
  </div>
);

const MissionHistoryChart: React.FC<{ data: MissionChartPoint[]; range: string; onRangeChange: (range: string) => void }> = ({ data, range, onRangeChange }) => {
  const max = Math.max(...data.flatMap((item) => [item.completed, item.cancelled, item.rejected]), 1);
  const width = 780;
  const height = 230;
  const pad = { left: 34, right: 20, top: 18, bottom: 34 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const lineFor = (key: keyof Pick<MissionChartPoint, 'completed' | 'cancelled' | 'rejected'>) =>
    data.map((item, index) => {
      const x = pad.left + (index / Math.max(data.length - 1, 1)) * chartW;
      const y = pad.top + chartH - (item[key] / max) * chartH;
      return `${x},${y}`;
    }).join(' ');

  return (
    <section className={`${driverCard} p-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-content-primary">Historique des missions</h2>
          <p className="mt-4 text-sm font-bold text-content-primary">Missions quotidiennes ({range === '7' ? '7' : range === '90' ? '90' : '30'} derniers jours)</p>
        </div>
        <select value={range} onChange={(event) => onRangeChange(event.target.value)} className="rounded-xl border border-surface-border-subtle bg-surface-card px-4 py-2 text-sm font-bold text-content-primary focus:outline-none focus:ring-4 focus:ring-blue-100">
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>
      <div className="mt-5 flex items-center justify-end gap-5 text-xs text-content-muted">
        <Legend color="#22C55E" label="Terminées" />
        <Legend color="#EF4444" label="Annulées" />
        <Legend color="#64748B" label="Rejetées" />
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-0">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <g key={pct}>
              <line x1={pad.left} x2={width - pad.right} y1={pad.top + chartH - pct * chartH} y2={pad.top + chartH - pct * chartH} stroke="#e8f0fb" strokeDasharray="4 4" />
              <text x={pad.left - 12} y={pad.top + chartH - pct * chartH + 4} textAnchor="end" className="fill-[#6c7894] text-[10px]">{Math.round(max * pct)}</text>
            </g>
          ))}
          <polyline fill="none" stroke="#22C55E" strokeWidth="3" points={lineFor('completed')} />
          <polyline fill="none" stroke="#EF4444" strokeWidth="3" points={lineFor('cancelled')} />
          <polyline fill="none" stroke="#64748B" strokeWidth="3" points={lineFor('rejected')} />
          {data.map((item, index) => {
            const x = pad.left + (index / Math.max(data.length - 1, 1)) * chartW;
            return (
              <text key={`${item.label}-${index}`} x={x} y={height - 8} textAnchor="middle" className="fill-[#6c7894] text-[10px]">
                {index % Math.ceil(data.length / 10) === 0 ? item.label : ''}
              </text>
            );
          })}
        </svg>
      </div>
      {data.every((item) => item.completed + item.cancelled + item.rejected === 0) && (
        <div className="mt-4 rounded-xl border border-surface-border-subtle bg-surface-muted px-4 py-3 text-sm text-content-muted">
          <Icon name="exclamation-circle" className="mr-2 inline h-5 w-5 text-brand-blue" />
          Aucune mission sur cette période.
        </div>
      )}
    </section>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-2"><span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: color }} />{label}</span>
);

export const DriverEarningsSummary: React.FC<{ breakdown: EarningsBreakdown; onOpen: () => void }> = ({ breakdown, onOpen }) => {
  const total = breakdown.base + breakdown.bonus + breakdown.tips + breakdown.other;
  const rows = [
    ['Gains de base', breakdown.base, 'currencyDollar', 'bg-green-50 text-green-600'],
    ['Bonus', breakdown.bonus, 'star', 'bg-orange-50 text-orange-500'],
    ['Pourboires', breakdown.tips, 'gift', 'bg-violet-50 text-violet-600'],
    ['Autres', breakdown.other, 'list', 'bg-slate-100 text-slate-500'],
  ] as const;
  return (
    <section className={`${driverCard} p-6`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-content-primary">Résumé des gains</h2>
        <select className="rounded-xl border border-surface-border-subtle bg-surface-card px-3 py-2 text-xs font-bold text-content-primary">
          <option>Cette semaine</option>
          <option>Ce mois</option>
        </select>
      </div>
      <div className="mt-6 space-y-4">
        {rows.map(([label, value, icon, tone]) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
                <Icon name={icon as any} className="h-4 w-4" />
              </span>
              <span className="text-sm text-content-primary">{label}</span>
            </div>
            <span className="font-black text-content-primary">{formatMoney(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t border-surface-border-subtle pt-5">
        <div className="flex items-center justify-between">
          <span className="font-black text-content-primary">Total estimé</span>
          <span className="text-3xl font-black text-brand-blue">{formatMoney(total)}</span>
        </div>
      </div>
      <button onClick={onOpen} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-blue px-4 py-3 text-sm font-black text-brand-blue transition hover:bg-brand-blue hover:text-white">
        <Icon name="document-text" className="h-4 w-4" />
        Voir tous mes gains
        <Icon name="arrowRight" className="h-4 w-4" />
      </button>
    </section>
  );
};

const AvailableMissionsList: React.FC<{ missions: LogisticsTask[]; onAccept: (mission: LogisticsTask) => void; isUpdating: boolean }> = ({ missions, onAccept, isUpdating }) => (
  <section className="rounded-2xl border border-surface-border-subtle bg-surface-card p-6 shadow-card">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-black text-content-primary">Missions disponibles</h2>
      <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-black text-brand-blue">{missions.length}</span>
    </div>
    <div className="mt-5 space-y-3">
      {missions.length ? missions.map((mission) => (
        <div key={mission.id} className="grid gap-3 rounded-xl border border-surface-border-subtle p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-black text-content-primary">#{mission.order_number || mission.order_id.slice(0, 8)}</p>
            <p className="text-sm text-content-muted">{mission.task_type === 'pickup' ? 'Collecte' : 'Livraison'} · {mission.pickup_commune || mission.delivery_commune || 'Kinshasa'} · {formatMoney(MONEY_PER_MISSION)}</p>
          </div>
          <button onClick={() => onAccept(mission)} disabled={isUpdating} className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700 disabled:cursor-wait disabled:opacity-60">
            Accepter
          </button>
        </div>
      )) : (
        <p className="rounded-xl bg-surface-muted p-4 text-sm text-content-muted">Aucune mission disponible pour le moment.</p>
      )}
    </div>
  </section>
);

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AVAILABILITY_SLOTS = ['Matin 08h-12h', 'Après-midi 12h-17h', 'Soir 17h-21h'] as const;

const loadAvailabilitySlots = (userId: string) => {
  try {
    const raw = localStorage.getItem(`driver-availability-slots-${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((slot): slot is string => typeof slot === 'string') : [];
  } catch {
    return [];
  }
};

const MissionHistoryTable: React.FC<{
  completed: LogisticsTask[];
  cancelled: LogisticsTask[];
  failed: LogisticsTask[];
  localOrders: Order[];
}> = ({ completed, cancelled, failed, localOrders }) => {
  const rows = useMemo(() => {
    const taskRows = [...completed, ...cancelled, ...failed].map((task) => ({
      id: task.id,
      reference: task.order_number || task.order_id?.slice(0, 8) || task.id.slice(0, 8),
      type: task.task_type === 'pickup' ? 'Collecte' : 'Livraison',
      status: getTaskStatusLabel(task.status),
      commune: task.pickup_commune || task.delivery_commune || 'Kinshasa',
      date: new Date(task.completed_at || task.updated_at || task.created_at).toLocaleString('fr-FR'),
      amount: task.status === 'completed' ? MONEY_PER_MISSION : 0,
    }));
    const orderRows = localOrders.map((order) => ({
      id: order.id,
      reference: order.id.slice(0, 8),
      type: 'Commande',
      status: 'Terminée',
      commune: order.clientDetails?.pickupAddress?.commune || 'Kinshasa',
      date: new Date(order.createdAt).toLocaleString('fr-FR'),
      amount: MONEY_PER_MISSION,
    }));
    return [...taskRows, ...orderRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [completed, cancelled, failed, localOrders]);

  return (
    <section className={`${driverCard} overflow-hidden`}>
      <div className="border-b border-surface-border-subtle px-6 py-4">
        <h2 className="text-lg font-black text-content-primary">Détail des missions</h2>
        <p className="mt-1 text-sm text-content-muted">{rows.length} entrée{rows.length > 1 ? 's' : ''} dans l’historique.</p>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs font-black uppercase text-content-muted">
              <tr>
                <th className="px-6 py-3">Réf.</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Zone</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Gain</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-surface-border-subtle">
                  <td className="px-6 py-4 font-bold text-content-primary">#{row.reference}</td>
                  <td className="px-6 py-4 text-content-muted">{row.type}</td>
                  <td className="px-6 py-4 text-content-primary">{row.status}</td>
                  <td className="px-6 py-4 text-content-muted">{row.commune}</td>
                  <td className="px-6 py-4 text-content-muted">{row.date}</td>
                  <td className="px-6 py-4 text-right font-black text-brand-blue">{row.amount ? formatMoney(row.amount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-6 py-8 text-sm text-content-muted">Aucune mission dans l’historique pour le moment.</p>
      )}
    </section>
  );
};

const DriverReferralPanel: React.FC<{
  referralCode: string;
  referredCount: number;
  conversions: number;
  bonusPoints: number;
  isLoading: boolean;
  onNotify: (message: string) => void;
}> = ({ referralCode, referredCount, conversions, bonusPoints, isLoading, onNotify }) => {
  const shareText = `Rejoignez Laundry Express comme chauffeur avec mon code ${referralCode}. Gagnez 5 % sur chaque mission parrainée !`;
  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    onNotify('Code de parrainage copié.');
  };
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Parrainage chauffeur Laundry Express', text: shareText, url: 'https://laundry.app/register' });
    } else {
      handleCopy();
    }
  };

  return (
    <section className={`${driverCard} p-6`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase text-brand-blue">Programme chauffeur</p>
          <h2 className="mt-2 text-2xl font-black text-content-primary">Parrainez un chauffeur</h2>
          <p className="mt-2 text-sm text-content-muted">
            Partagez votre code : vous gagnez <strong className="text-content-primary">5 %</strong> sur chaque mission réalisée par vos filleuls.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-dashed border-brand-blue bg-brand-blue/5 px-4 py-3 font-mono text-lg font-black tracking-widest text-brand-blue">
              {isLoading ? '…' : referralCode || '—'}
            </span>
            <button type="button" onClick={handleCopy} disabled={!referralCode} className="rounded-xl border border-brand-blue px-4 py-2 text-sm font-black text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-50">
              Copier le code
            </button>
            <button type="button" onClick={handleShare} disabled={!referralCode} className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700 disabled:opacity-50">
              Partager
            </button>
          </div>
        </div>
        <img src={REFERRAL_IMAGE} alt="Gains de parrainage chauffeur" className="mx-auto h-40 w-full max-w-xs object-contain" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface-muted p-4">
          <p className="text-sm text-content-muted">Chauffeurs invités</p>
          <p className="mt-2 text-3xl font-black text-content-primary">{referredCount}</p>
        </div>
        <div className="rounded-xl bg-surface-muted p-4">
          <p className="text-sm text-content-muted">Conversions</p>
          <p className="mt-2 text-3xl font-black text-content-primary">{conversions}</p>
        </div>
        <div className="rounded-xl bg-surface-muted p-4">
          <p className="text-sm text-content-muted">Bonus cumulés</p>
          <p className="mt-2 text-3xl font-black text-brand-blue">{bonusPoints} pts</p>
        </div>
      </div>
    </section>
  );
};

const DocumentUploadButton: React.FC<{ label: string; onUploaded: (label: string, filename: string) => void }> = ({ label, onUploaded }) => (
  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-brand-blue px-4 py-2 text-sm font-black text-brand-blue transition hover:bg-brand-blue hover:text-white focus-within:ring-4 focus-within:ring-blue-100">
    Mettre à jour
    <input
      type="file"
      className="sr-only"
      accept="image/*,.pdf"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onUploaded(label, file.name);
      }}
    />
  </label>
);

const DriverSectionPanel: React.FC<{
  activeSection: Exclude<DriverSection, 'dashboard' | 'missions' | 'history'>;
  available: boolean;
  onToggleAvailability: () => void;
  earningsBreakdown: EarningsBreakdown;
  completedCount: number;
  isUpdating: boolean;
  onNavigateSupport: () => void;
  onNotify: (message: string) => void;
  selectedSlots: string[];
  onToggleSlot: (slot: string) => void;
  user: User;
  onUpdateNotificationPref: (key: keyof NotificationPreferences, value: boolean) => void;
  referralCode: string;
  referralStats: { referredUsersCount: number; completedConversions: number; totalBonusPoints: number };
  referralLoading: boolean;
}> = ({
  activeSection,
  available,
  onToggleAvailability,
  earningsBreakdown,
  completedCount,
  isUpdating,
  onNavigateSupport,
  onNotify,
  selectedSlots,
  onToggleSlot,
  user,
  onUpdateNotificationPref,
  referralCode,
  referralStats,
  referralLoading,
}) => {
  const panelBase = `${driverCard} p-6`;
  const total = earningsBreakdown.base + earningsBreakdown.bonus + earningsBreakdown.tips + earningsBreakdown.other;
  const notifPrefs = user.notificationPreferences || {
    newOrder: true,
    orderStatusChange: true,
    newChatMessage: true,
    promotions: false,
    general: true,
  };

  if (activeSection === 'earnings') {
    return (
      <section className={panelBase}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-brand-blue">Paiements chauffeur</p>
            <h2 className="mt-2 text-2xl font-black text-content-primary">Relevé des gains</h2>
            <p className="mt-1 text-sm text-content-muted">{completedCount} mission{completedCount > 1 ? 's' : ''} terminée{completedCount > 1 ? 's' : ''} enregistrée{completedCount > 1 ? 's' : ''}.</p>
          </div>
          <button
            onClick={() => downloadTextFile('releve-gains-chauffeur.csv', `categorie,montant\nbase,${earningsBreakdown.base}\nbonus,${earningsBreakdown.bonus}\npourboires,${earningsBreakdown.tips}\nautres,${earningsBreakdown.other}\ntotal,${total}\n`)}
            className="rounded-xl bg-brand-blue px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-700"
          >
            Télécharger le relevé
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ['Base', earningsBreakdown.base],
            ['Bonus', earningsBreakdown.bonus],
            ['Pourboires', earningsBreakdown.tips],
            ['Autres', earningsBreakdown.other],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-surface-muted p-4">
              <p className="text-sm text-content-muted">{label}</p>
              <p className="mt-2 text-2xl font-black text-content-primary">{formatMoney(Number(value))}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (activeSection === 'availability') {
    return (
      <section className="space-y-6">
        <div className={`${panelBase} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className="text-xs font-black uppercase text-brand-blue">Statut actuel</p>
            <h2 className="mt-2 text-2xl font-black text-content-primary">{available ? 'Vous êtes disponible' : 'Vous êtes indisponible'}</h2>
            <p className="mt-1 text-sm text-content-muted">Les missions vous sont proposées uniquement lorsque vous êtes en ligne.</p>
          </div>
          <button type="button" onClick={onToggleAvailability} disabled={isUpdating} className="rounded-xl bg-brand-blue px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-700 disabled:opacity-60">
            {available ? 'Passer indisponible' : 'Me rendre disponible'}
          </button>
        </div>
        <section className={panelBase}>
          <p className="text-xs font-black uppercase text-brand-blue">Créneaux préférés</p>
          <h2 className="mt-2 text-2xl font-black text-content-primary">Planifier votre journée</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {AVAILABILITY_SLOTS.map((slot) => {
              const active = selectedSlots.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onToggleSlot(slot)}
                  className={`rounded-xl border p-4 text-left text-sm font-bold transition ${
                    active ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-surface-border-subtle hover:bg-surface-muted'
                  }`}
                >
                  <Icon name="calendar" className="mb-3 h-5 w-5 text-brand-blue" />
                  {slot}
                  {active && <span className="mt-2 block text-xs font-black uppercase">Sélectionné</span>}
                </button>
              );
            })}
          </div>
        </section>
      </section>
    );
  }

  if (activeSection === 'documents') {
    const docs = ['Permis de conduire', 'Carte d’identité', 'Assurance véhicule', 'Photo du véhicule'];
    return (
      <section className={panelBase}>
        <p className="text-xs font-black uppercase text-brand-blue">Conformité</p>
        <h2 className="mt-2 text-2xl font-black text-content-primary">Documents chauffeur</h2>
        <div className="mt-5 space-y-3">
          {docs.map((doc) => (
            <div key={doc} className="flex flex-col gap-3 rounded-xl border border-surface-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-content-primary">{doc}</p>
                <p className="text-sm text-green-700">Vérification prête à synchroniser</p>
              </div>
              <DocumentUploadButton label={doc} onUploaded={(label, filename) => onNotify(`${label} sélectionné : ${filename}`)} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (activeSection === 'support') {
    return (
      <section className={panelBase}>
        <p className="text-xs font-black uppercase text-brand-blue">Assistance opérationnelle</p>
        <h2 className="mt-2 text-2xl font-black text-content-primary">Support chauffeur 24/7</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <a href="tel:+243812345678" className="rounded-xl border border-surface-border-subtle p-4 font-bold hover:bg-surface-muted"><Icon name="phone" className="mb-3 h-5 w-5 text-brand-blue" />Appeler le dispatch</a>
          <a href="mailto:support@laundryexpress.cd" className="rounded-xl border border-surface-border-subtle p-4 font-bold hover:bg-surface-muted"><Icon name="envelope" className="mb-3 h-5 w-5 text-brand-blue" />Envoyer un email</a>
          <button onClick={onNavigateSupport} className="rounded-xl border border-surface-border-subtle p-4 text-left font-bold hover:bg-surface-muted"><Icon name="lifebuoy" className="mb-3 h-5 w-5 text-brand-blue" />Ouvrir le centre support</button>
        </div>
      </section>
    );
  }

  if (activeSection === 'settings') {
    const settings: { key: keyof NotificationPreferences; label: string; description: string }[] = [
      { key: 'newOrder', label: 'Notifications mission', description: 'Alertes pour les nouvelles missions disponibles.' },
      { key: 'orderStatusChange', label: 'Alertes retard', description: 'Rappels si une mission prend du retard.' },
      { key: 'general', label: 'Résumé quotidien', description: 'Récapitulatif de votre activité chaque soir.' },
      { key: 'newChatMessage', label: 'Messages client', description: 'Notifications des messages dans le chat mission.' },
      { key: 'promotions', label: 'Bonus et campagnes', description: 'Offres spéciales et primes chauffeur.' },
    ];
    return (
      <section className={panelBase}>
        <p className="text-xs font-black uppercase text-brand-blue">Préférences</p>
        <h2 className="mt-2 text-2xl font-black text-content-primary">Paramètres chauffeur</h2>
        <div className="mt-5 space-y-3">
          {settings.map((setting) => {
            const enabled = Boolean(notifPrefs[setting.key]);
            return (
              <div key={setting.key} className="flex flex-col gap-3 rounded-xl border border-surface-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-content-primary">{setting.label}</p>
                  <p className="text-sm text-content-muted">{setting.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => onUpdateNotificationPref(setting.key, !enabled)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${enabled ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-muted'}`}
                >
                  {enabled ? 'Activé' : 'Désactivé'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (activeSection === 'referral') {
    return (
      <DriverReferralPanel
        referralCode={referralCode}
        referredCount={referralStats.referredUsersCount}
        conversions={referralStats.completedConversions}
        bonusPoints={referralStats.totalBonusPoints}
        isLoading={referralLoading}
        onNotify={onNotify}
      />
    );
  }

  return null;
};

export const DriverDashboardPage: React.FC = () => {
  const {
    user,
    getOrdersForDriver,
    getCompletedOrdersForDriver,
    updateUser,
    updateOrderStatus,
    addNotification,
    setCurrentPage,
    logout,
    openDriverMissionForOrderId,
    setOpenDriverMissionForOrderId,
  } = useAppContext();
  const [activeSection, setActiveSection] = useState<DriverSection>(() => {
    const hash = window.location.hash.replace('#', '');
    return isDriverSection(hash) ? hash : 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [chattingOrder, setChattingOrder] = useState<Order | null>(null);
  const [liveTasks, setLiveTasks] = useState<LogisticsTask[]>([]);
  const [liveDriver, setLiveDriver] = useState<LogisticsDriver | null>(null);
  const [historyRange, setHistoryRange] = useState('30');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [showProofSheet, setShowProofSheet] = useState(false);
  const [activeMissionView, setActiveMissionView] = useState<'dashboard' | 'mission'>('dashboard');
  const [missionSubPhase, setMissionSubPhase] = useState<MissionSubPhase | null>(null);
  const trackedMissionsRef = useRef<Set<string>>(new Set());
  const missionRef = useRef<HTMLDivElement>(null);
  const { stats: referralStats, isLoading: referralLoading } = useMyReferralStats(!!user && user.role === 'driver');

  const handleSectionChange = useCallback((section: DriverSection) => {
    setActiveSection(section);
    const nextUrl = `${window.location.pathname}${window.location.search}#${section}`;
    window.history.replaceState(null, '', nextUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (isDriverSection(hash)) setActiveSection(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (user?.id) setSelectedSlots(loadAvailabilitySlots(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`driver-availability-slots-${user.id}`, JSON.stringify(selectedSlots));
  }, [selectedSlots, user?.id]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_dashboard_viewed' } }));
  }, []);

  useEffect(() => {
    if (openDriverMissionForOrderId) {
      setTimeout(() => missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      setOpenDriverMissionForOrderId(null);
    }
  }, [openDriverMissionForOrderId, setOpenDriverMissionForOrderId]);

  const refreshDriverData = useCallback(async () => {
    if (!user || user.role !== 'driver') return;
    try {
      const [tasksResponse, myDriver] = await Promise.all([
        realApi.getLogisticsTasks({ page: 1, page_size: 100 }),
        realApi.getMyDriverProfile().catch(() => null),
      ]);
      setLiveTasks(tasksResponse.tasks || []);
      setLiveDriver(myDriver || null);
    } catch {
      setLiveTasks([]);
      setLiveDriver(null);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadDriverData = async () => {
      if (!isMounted) return;
      await refreshDriverData();
    };
    loadDriverData();
    const poll = window.setInterval(() => {
      if (isMounted) void refreshDriverData();
    }, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(poll);
    };
  }, [refreshDriverData]);

  const localCompletedOrders = useMemo(() => (user ? getCompletedOrdersForDriver(user.id) : []), [user, getCompletedOrdersForDriver]);
  const localCurrentOrder = useMemo(() => (user ? getOrdersForDriver(user.id) : null), [user, getOrdersForDriver]);

  const activeTask = useMemo(() => liveTasks.find((task) => ['driver_assigned', 'accepted', 'in_progress'].includes(task.status)) || null, [liveTasks]);

  useEffect(() => {
    if (!activeTask) {
      setMissionSubPhase(null);
      return;
    }
    if (!trackedMissionsRef.current.has(activeTask.id)) {
      trackedMissionsRef.current.add(activeTask.id);
      pilotTrackMissionStart(activeTask.id);
      if (['driver_assigned', 'accepted', 'in_progress'].includes(activeTask.status)) {
        pilotTrackAssignment(activeTask.id);
      }
    }
    const stored = getMissionSubPhase(activeTask.id);
    if (stored) {
      setMissionSubPhase(stored);
    } else if (activeTask.status === 'in_progress') {
      setMissionSubPhase('in_transit_pickup');
      persistMissionSubPhase(activeTask.id, 'in_transit_pickup');
    } else {
      setMissionSubPhase(null);
    }
  }, [activeTask?.id, activeTask?.status]);

  useEffect(() => {
    if (!liveDriver?.id || !activeTask || activeTask.status !== 'in_progress') return;
    if (!navigator.geolocation) return;

    const pushLocation = (latitude: number, longitude: number) => {
      realApi.updateDriverLocation(liveDriver.id, latitude, longitude).catch(() => {});
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => pushLocation(position.coords.latitude, position.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [liveDriver?.id, activeTask?.id, activeTask?.status]);

  const allAvailableTasks = useMemo(() => liveTasks.filter((task) => ['pending', 'open_market', 'claimed'].includes(task.status)), [liveTasks]);
  const completedTasks = useMemo(() => liveTasks.filter((task) => task.status === 'completed'), [liveTasks]);
  const cancelledTasks = useMemo(() => liveTasks.filter((task) => task.status === 'cancelled' || task.status === 'expired'), [liveTasks]);
  const rejectedTasks = useMemo(() => liveTasks.filter((task) => task.status === 'failed'), [liveTasks]);

  const available = liveDriver ? liveDriver.is_available : user?.driverStatus === 'AVAILABLE';
  const rating = safeNumber(liveDriver?.rating_avg, 5);
  const reviewCount = safeNumber(liveDriver?.rating_count, 0);

  const stats = useMemo<DriverStats>(() => {
    const todayKey = formatDateKey(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedToday = completedTasks.filter((task) => formatDateKey(new Date(task.completed_at || task.updated_at || task.created_at)) === todayKey).length
      || localCompletedOrders.filter((order) => formatDateKey(new Date(order.createdAt)) === todayKey).length;
    const completedTotal = Math.max(completedTasks.length, localCompletedOrders.length);
    const weeklyMissionCount = completedTasks.filter((task) => new Date(task.completed_at || task.updated_at || task.created_at) >= weekAgo).length
      || localCompletedOrders.filter((order) => new Date(order.createdAt) >= weekAgo).length;
    const offeredMissions = Math.max(liveTasks.length, completedTotal);
    const acceptedMissions = liveTasks.filter((task) => ['accepted', 'in_progress', 'completed'].includes(task.status)).length || completedTotal;
    const acceptanceRate = offeredMissions > 0 ? Math.round((acceptedMissions / offeredMissions) * 100) : 0;
    return {
      completedToday,
      totalEstimatedEarnings: completedTotal * MONEY_PER_MISSION,
      weeklyEarnings: weeklyMissionCount * MONEY_PER_MISSION,
      weeklyMissionCount,
      acceptanceRate,
      acceptedMissions,
      offeredMissions,
    };
  }, [completedTasks, liveTasks, localCompletedOrders]);

  const earningsBreakdown = useMemo<EarningsBreakdown>(() => ({
    base: stats.weeklyEarnings,
    bonus: stats.weeklyMissionCount >= 10 ? 5 : 0,
    tips: 0,
    other: 0,
  }), [stats]);

  const missionHistoryChartData = useMemo<MissionChartPoint[]>(() => {
    const days = Number(historyRange);
    return Array.from({ length: days }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - index - 1));
      const key = formatDateKey(date);
      return {
        label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        completed: completedTasks.filter((task) => formatDateKey(new Date(task.completed_at || task.updated_at || task.created_at)) === key).length
          || localCompletedOrders.filter((order) => formatDateKey(new Date(order.createdAt)) === key).length,
        cancelled: cancelledTasks.filter((task) => formatDateKey(new Date(task.updated_at || task.created_at)) === key).length,
        rejected: rejectedTasks.filter((task) => formatDateKey(new Date(task.updated_at || task.created_at)) === key).length,
      };
    });
  }, [historyRange, completedTasks, cancelledTasks, rejectedTasks, localCompletedOrders]);

  const activeMissionOrder = useMemo(() => {
    if (activeTask) return buildOrderFromTask(activeTask);
    return localCurrentOrder || null;
  }, [activeTask, localCurrentOrder]);

  const handleAvailabilityToggle = async () => {
    if (!user) return;
    const nextAvailable = !available;
    setIsUpdating(true);
    try {
      try {
        await realApi.updateMyDriverAvailability(nextAvailable);
      } catch {
        try {
          await realApi.updateDriverAvailability(nextAvailable);
        } catch {
          // Keep the dashboard usable while older backends catch up with /driver/availability.
        }
      }
      await updateUser({ ...user, driverStatus: nextAvailable ? 'AVAILABLE' : 'UNAVAILABLE' });
      setLiveDriver((driver) => driver ? { ...driver, is_available: nextAvailable } : driver);
      addNotification(nextAvailable ? 'Vous êtes maintenant disponible.' : 'Vous êtes maintenant indisponible.', 'success');
      window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_availability_toggled', available: nextAvailable } }));
    } catch {
      addNotification('Impossible de modifier votre statut. Réessayez.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptMission = async (mission: LogisticsTask) => {
    setIsUpdating(true);
    try {
      const updated = await realApi.acceptLogisticsTask(mission.id);
      setLiveTasks((tasks) => tasks.map((task) => task.id === updated.id ? updated : task));
      pilotTrackMissionStart(mission.id);
      pilotTrackAssignment(mission.id);
      addNotification('Mission acceptée.', 'success');
      window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_mission_accepted', missionId: mission.id } }));
    } catch {
      addNotification('Impossible d’accepter cette mission.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSlot = (slot: string) => {
    setSelectedSlots((current) => {
      const next = current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot];
      addNotification(
        next.includes(slot) ? `${slot} ajouté à vos préférences.` : `${slot} retiré de vos préférences.`,
        'success',
      );
      return next;
    });
  };

  const handleUpdateNotificationPref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;
    const nextPrefs = { ...user.notificationPreferences, [key]: value };
    try {
      await updateUser({ ...user, notificationPreferences: nextPrefs });
      addNotification('Préférences mises à jour.', 'success');
    } catch {
      addNotification('Impossible de sauvegarder les préférences.', 'error');
    }
  };

  const referralCode = referralStats.referralCode || user?.referralCode || '';
  const driverName = useMemo(
    () => resolveGreetingName({ fullName: liveDriver?.user_name || user?.name, fallback: 'Chauffeur' }),
    [liveDriver?.user_name, user?.name]
  );
  const sectionMeta = SECTION_LABELS[activeSection];
  const completedCount = completedTasks.length || localCompletedOrders.length;
  const isDashboard = activeSection === 'dashboard';

  if (!user || user.role !== 'driver') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-page p-6">
        <div className="rounded-2xl border border-surface-border-subtle bg-surface-card p-8 text-center shadow-sm">
          <Icon name="truck" className="mx-auto h-12 w-12 text-brand-blue" />
          <h1 className="mt-4 text-2xl font-black text-content-primary">Accès chauffeur uniquement</h1>
          <p className="mt-2 text-content-muted">Connectez-vous avec un compte chauffeur pour ouvrir ce tableau de bord.</p>
        </div>
      </div>
    );
  }

  const handleArrivePickup = () => {
    if (!activeTask) return;
    setMissionSubPhase('in_transit_delivery');
    persistMissionSubPhase(activeTask.id, 'in_transit_delivery');
    pilotTrackPickup(activeTask.id);
    addNotification('Arrivée au pickup confirmée. En route vers le client.', 'success');
  };

  const handleMissionAction = async () => {
    if (activeTask?.status === 'in_progress') {
      const phase = missionSubPhase ?? getMissionSubPhase(activeTask.id) ?? 'in_transit_pickup';
      if (phase === 'in_transit_pickup') {
        handleArrivePickup();
        return;
      }
      setShowProofSheet(true);
      return;
    }

    setIsUpdating(true);
    try {
      if (activeTask) {
        const updatedTask = activeTask.status === 'driver_assigned'
          ? await realApi.acceptLogisticsTask(activeTask.id)
          : activeTask.status === 'accepted'
            ? await realApi.startLogisticsTask(activeTask.id)
            : await realApi.completeLogisticsTask(activeTask.id);

        if (activeTask.status === 'driver_assigned') {
          pilotTrackAssignment(activeTask.id);
        }
        if (activeTask.status === 'accepted') {
          setMissionSubPhase('in_transit_pickup');
          persistMissionSubPhase(activeTask.id, 'in_transit_pickup');
          setActiveMissionView('mission');
        }
        setLiveTasks((tasks) => tasks.map((task) => task.id === updatedTask.id ? updatedTask : task));
        addNotification('Mission mise à jour avec succès.', 'success');
        return;
      }
      if (localCurrentOrder?.status === OrderStatus.PICKUP) {
        await updateOrderStatus(localCurrentOrder.id, OrderStatus.PROCESSING);
        addNotification('Collecte confirmée.', 'success');
      } else if (localCurrentOrder?.status === OrderStatus.DELIVERY) {
        await updateOrderStatus(localCurrentOrder.id, OrderStatus.COMPLETED);
        addNotification('Livraison confirmée.', 'success');
      }
    } catch {
      addNotification('Impossible de mettre à jour la mission.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProofSubmit = async (photo: File | null, comment: string) => {
    if (!activeTask) {
      setShowProofSheet(false);
      return;
    }
    setIsUpdating(true);
    try {
      let proofPhotoUrl: string | undefined;
      if (photo) {
        proofPhotoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('photo-read-failed'));
          reader.readAsDataURL(photo);
        });
      }
      const updatedTask = await realApi.completeLogisticsTask(
        activeTask.id,
        comment || 'Livraison confirmée depuis l’app chauffeur',
        proofPhotoUrl,
      );
      clearMissionSubPhase(activeTask.id);
      setMissionSubPhase(null);
      pilotTrackDelivery(activeTask.id);
      setLiveTasks((tasks) => tasks.map((task) => task.id === updatedTask.id ? updatedTask : task));
      setShowProofSheet(false);
      setActiveMissionView('dashboard');
      addNotification('Preuve de livraison envoyée.', 'success');
    } catch {
      addNotification('Impossible d’envoyer la preuve de livraison.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncidentSubmit = async (type: string, description: string) => {
    if (!activeTask) return;
    setIsUpdating(true);
    try {
      const reason = `[${type}] ${description}`.trim();
      const updatedTask = await realApi.failLogisticsTask(activeTask.id, reason || type);
      clearMissionSubPhase(activeTask.id);
      setMissionSubPhase(null);
      pilotTrackIncident(activeTask.id, type);
      setLiveTasks((tasks) => tasks.map((task) => task.id === updatedTask.id ? updatedTask : task));
      setActiveMissionView('dashboard');
      addNotification('Incident signalé au dispatch.', 'success');
    } catch {
      addNotification('Impossible de signaler l’incident.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const mobileNavItems: MobileNavItem[] = [
    { key: 'dashboard', label: 'Accueil', icon: 'home' },
    { key: 'missions', label: 'Missions', icon: 'shoppingBag', badge: allAvailableTasks.length },
    { key: 'history', label: 'Historique', icon: 'clock' },
    { key: 'earnings', label: 'Gains', icon: 'currencyDollar' },
    { key: 'settings', label: 'Plus', icon: 'bars3' },
  ];

  if (activeMissionView === 'mission' && activeTask) {
    return (
      <div className="driver-shell min-h-screen bg-surface-page text-content-primary">
        <DriverMissionScreen
          mission={activeTask}
          onBack={() => setActiveMissionView('dashboard')}
          onAction={handleMissionAction}
          onComplete={() => setShowProofSheet(true)}
          onCallClient={() => {
            const phone = getTaskPhone(activeTask);
            if (phone) window.open(`tel:${phone}`, '_self');
          }}
          onOpenMap={() => {
            const addr = getTaskDeliveryAddress(activeTask);
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
          }}
          onOpenProof={() => setShowProofSheet(true)}
          isUpdating={isUpdating}
        />
        <DeliveryProofSheet
          isOpen={showProofSheet}
          onClose={() => setShowProofSheet(false)}
          onSubmit={handleProofSubmit}
          isSubmitting={isUpdating}
        />
      </div>
    );
  }

  /* ─── Mobile-only: DriverMobileDashboard ─── */
  const mobileMissionData = activeTask ? {
    id: activeTask.id,
    orderRef: activeTask.order_number || activeTask.order_id?.slice(0, 8) || activeTask.id.slice(0, 8),
    type: (activeTask.task_type || 'delivery') as 'pickup' | 'delivery',
    status: activeTask.status || 'driver_assigned',
    statusLabel: getTaskStatusLabel(activeTask.status),
    clientName: getTaskClientName(activeTask),
    clientPhone: getTaskPhone(activeTask),
    pickupAddress: getTaskPickupAddress(activeTask),
    deliveryAddress: getTaskDeliveryAddress(activeTask),
    eta: activeTask.scheduled_at
      ? new Date(activeTask.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '--',
    gain: `${formatMoney(MONEY_PER_MISSION)}`,
    distance: '--',
  } : null;

  return (
    <div className="driver-shell min-h-screen bg-surface-page text-content-primary">
      {/* Mobile: dedicated dashboard */}
      <div className="md:hidden">
        <DriverMobileDashboard
          mission={mobileMissionData}
          availableMissions={allAvailableTasks.map((t) => ({
            id: t.id,
            orderRef: t.order_number || t.order_id?.slice(0, 8) || t.id.slice(0, 8),
            type: (t.task_type || 'delivery') as 'pickup' | 'delivery',
            status: t.status || 'pending',
            statusLabel: getTaskStatusLabel(t.status),
            clientName: getTaskClientName(t),
            pickupZone: t.pickup_commune || 'Kinshasa',
            deliveryZone: t.delivery_commune || 'Kinshasa',
            gain: formatMoney(MONEY_PER_MISSION),
            time: t.scheduled_at
              ? new Date(t.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : '--',
          }))}
          missionHistory={completedTasks.map((t) => ({
            id: t.id,
            orderRef: t.order_number || t.order_id?.slice(0, 8) || t.id.slice(0, 8),
            type: (t.task_type || 'delivery') as 'pickup' | 'delivery',
            status: t.status || 'completed',
            statusLabel: getTaskStatusLabel(t.status),
            clientName: getTaskClientName(t),
            pickupZone: t.pickup_commune || 'Kinshasa',
            deliveryZone: t.delivery_commune || 'Kinshasa',
            gain: formatMoney(MONEY_PER_MISSION),
            time: t.completed_at
              ? new Date(t.completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : '--',
          }))}
          earnings={[]}
          stats={{
            completedToday: stats.completedToday,
            totalEarnings: formatMoney(stats.totalEstimatedEarnings),
            weeklyEarnings: formatMoney(stats.weeklyEarnings),
            weeklyMissions: stats.weeklyMissionCount,
            rating,
            reviewCount,
            acceptanceRate: stats.acceptanceRate,
          }}
          driverName={driverName}
          driverPhone={(user as any)?.phone || ''}
          driverEmail={(user as any)?.email || ''}
          avatarUrl={(user as any)?.avatarUrl}
          isAvailable={available}
          referralCode={referralCode}
          referralCount={referralStats.referredUsersCount}
          onToggleAvailability={handleAvailabilityToggle}
          onAcceptMission={(id) => {
            const task = allAvailableTasks.find((t) => t.id === id);
            if (task) handleAcceptMission(task);
          }}
          onStartMission={handleMissionAction}
          onCompleteMission={() => setShowProofSheet(true)}
          onArrivePickup={handleArrivePickup}
          onArriveDelivery={() => setShowProofSheet(true)}
          onIncidentSubmit={handleIncidentSubmit}
          onProofSubmit={handleProofSubmit}
          onOpenMissionScreen={() => setActiveMissionView('mission')}
          missionSubPhase={missionSubPhase}
          onCallClient={() => {
            if (activeTask) {
              const phone = getTaskPhone(activeTask);
              if (phone) window.open(`tel:${phone}`, '_self');
            }
          }}
          onOpenMap={() => {
            if (activeTask) {
              const addr = getTaskDeliveryAddress(activeTask);
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
            }
          }}
          onNavigate={(page) => {
            if (page === 'logout') logout();
            else setCurrentPage({ name: page as any });
          }}
          onAvatarChange={async (file) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const avatarUrl = e.target?.result as string;
              await updateUser({ ...user, avatarUrl } as any);
              addNotification('Photo de profil mise à jour.', 'success');
            };
            reader.readAsDataURL(file);
          }}
          onSaveProfile={async (data) => {
            await updateUser({ ...user, name: data.name, phone: data.phone, email: data.email } as any);
            addNotification('Profil mis à jour.', 'success');
          }}
          onRefresh={refreshDriverData}
          isUpdating={isUpdating}
        />
      </div>

      {/* Desktop: original layout */}
      <div className="hidden md:block">
      <DriverSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onNavigate={setCurrentPage}
        onLogout={logout}
      />
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="h-full w-[min(280px,88vw)] bg-surface-card p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <DriverSidebar
              mobile
              activeSection={activeSection}
              onSectionChange={(section) => {
                handleSectionChange(section);
                setIsSidebarOpen(false);
              }}
              onNavigate={setCurrentPage}
              onLogout={logout}
            />
          </div>
        </div>
      )}
      <DriverTopbar driverName={driverName} avatarUrl={(user as { avatarUrl?: string }).avatarUrl} onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="relative z-0 px-4 pb-24 pt-[88px] md:ml-[260px] md:px-8 md:pb-8 md:pt-6">
        <div key={activeSection} className="mx-auto max-w-[1500px] space-y-6">
          <DriverDesktopBar driverName={driverName} />
          <section>
            {!isDashboard && (
              <button
                type="button"
                onClick={() => handleSectionChange('dashboard')}
                className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline"
              >
                <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                Retour au tableau de bord
              </button>
            )}
            <h1 className="text-3xl font-black tracking-normal text-content-primary">
              {isDashboard ? `Tableau de bord chauffeur 👋` : sectionMeta.title}
            </h1>
            <p className="mt-2 text-content-muted">
              {isDashboard ? `Bienvenue, ${driverName} ! Voici un aperçu de votre activité.` : sectionMeta.subtitle}
            </p>
          </section>

          {isDashboard && (
            <>
              <DriverKpiCards stats={stats} rating={rating} reviewCount={reviewCount} />

              <DriverAvailabilityToggle available={available} isUpdating={isUpdating} onToggle={handleAvailabilityToggle} />

              <div className="hidden xl:grid xl:grid-cols-[1fr_0.98fr]">
                <DriverStatusCard available={available} isUpdating={isUpdating} onToggle={handleAvailabilityToggle} />
                <DriverTipsCard acceptanceRate={stats.acceptanceRate} accepted={stats.acceptedMissions} offered={stats.offeredMissions} />
              </div>

              <div ref={missionRef}>
                <DriverActiveMissionCard
                  mission={activeTask}
                  available={available}
                  onAccept={handleMissionAction}
                  onStart={handleMissionAction}
                  onComplete={handleMissionAction}
                  onCallClient={() => {
                    if (activeTask) {
                      const phone = getTaskPhone(activeTask);
                      if (phone) window.open(`tel:${phone}`, '_self');
                    }
                  }}
                  onOpenMap={() => {
                    if (activeTask) {
                      const addr = getTaskDeliveryAddress(activeTask);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
                    }
                  }}
                  onViewMissions={() => handleSectionChange('missions')}
                  isUpdating={isUpdating}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                <MissionHistoryChart data={missionHistoryChartData} range={historyRange} onRangeChange={setHistoryRange} />
                <DriverEarningsSummary
                  breakdown={earningsBreakdown}
                  onOpen={() => {
                    handleSectionChange('earnings');
                    window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_earnings_clicked' } }));
                  }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['missions', 'Missions', 'Voir toutes les missions disponibles.', 'shoppingBag'],
                  ['history', 'Historique', 'Consultez vos missions passées.', 'clock'],
                  ['documents', 'Documents', 'Permis, assurance et pièces vérifiées.', 'document-text'],
                  ['support', 'Support', 'Assistance disponible à tout moment.', 'lifebuoy'],
                  ['availability', 'Disponibilité', 'Planifiez vos créneaux de travail.', 'calendar'],
                  ['settings', 'Paramètres', 'Préférences du compte chauffeur.', 'pencil'],
                  ['referral', 'Parrainage', 'Gagnez 5 % sur chaque filleul.', 'gift'],
                ].map(([section, title, description, icon]) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => handleSectionChange(section as DriverSection)}
                    className="rounded-2xl border border-surface-border-subtle bg-surface-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                  >
                    <Icon name={icon as any} className="h-6 w-6 text-brand-blue" />
                    <h3 className="mt-4 font-black text-content-primary">{title}</h3>
                    <p className="mt-2 text-sm text-content-muted">{description}</p>
                  </button>
                ))}
              </div>

              <div className="lg:hidden">
                <DriverReferralCard onOpen={() => handleSectionChange('referral')} />
              </div>
            </>
          )}

          {activeSection === 'missions' && (
            <div className="space-y-6">
              <DriverAvailabilityToggle available={available} isUpdating={isUpdating} onToggle={handleAvailabilityToggle} />
              <div ref={missionRef}>
                <DriverActiveMissionCard
                  mission={activeTask}
                  available={available}
                  onAccept={handleMissionAction}
                  onStart={handleMissionAction}
                  onComplete={handleMissionAction}
                  onCallClient={() => {
                    if (activeTask) {
                      const phone = getTaskPhone(activeTask);
                      if (phone) window.open(`tel:${phone}`, '_self');
                    }
                  }}
                  onOpenMap={() => {
                    if (activeTask) {
                      const addr = getTaskDeliveryAddress(activeTask);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
                    }
                  }}
                  onViewMissions={() => missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  isUpdating={isUpdating}
                />
              </div>
              <AvailableMissionsList missions={allAvailableTasks} onAccept={handleAcceptMission} isUpdating={isUpdating} />
            </div>
          )}

          {activeSection === 'history' && (
            <div className="space-y-6">
              <MissionHistoryChart data={missionHistoryChartData} range={historyRange} onRangeChange={setHistoryRange} />
              <MissionHistoryTable
                completed={completedTasks}
                cancelled={cancelledTasks}
                failed={rejectedTasks}
                localOrders={localCompletedOrders}
              />
            </div>
          )}

          {activeSection !== 'dashboard' && activeSection !== 'missions' && activeSection !== 'history' && (
            <DriverSectionPanel
              activeSection={activeSection}
              available={available}
              onToggleAvailability={handleAvailabilityToggle}
              earningsBreakdown={earningsBreakdown}
              completedCount={completedCount}
              isUpdating={isUpdating}
              onNavigateSupport={() => setCurrentPage({ name: 'support' })}
              onNotify={(message) => addNotification(message, 'success')}
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
              user={user}
              onUpdateNotificationPref={handleUpdateNotificationPref}
              referralCode={referralCode}
              referralStats={referralStats}
              referralLoading={referralLoading}
            />
          )}
        </div>
      </main>

      <ChatModal isOpen={!!chattingOrder} onClose={() => setChattingOrder(null)} order={chattingOrder} />
      </div>
    </div>
  );
};
