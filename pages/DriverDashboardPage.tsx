import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatModal } from '../components/ChatModal';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import { LogisticsDriver, LogisticsTask, realApi } from '../services/real-api';
import { Order, OrderStatus } from '../types';

type DriverSection = 'dashboard' | 'missions' | 'history' | 'earnings' | 'availability' | 'documents' | 'support' | 'settings';

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
  mobile?: boolean;
}> = ({ activeSection, onSectionChange, onNavigate, mobile = false }) => {
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
    <aside className={`${mobile ? 'flex h-full w-full' : 'hidden lg:flex fixed inset-y-0 left-0 z-30 w-[260px]'} flex-col border-r border-[#e4edf9] bg-white px-4 py-5`}>
      <button onClick={() => onNavigate({ name: 'home' })} className="mb-8 flex items-center gap-3 px-2 text-left" aria-label="Retour à l’accueil">
        <Icon name="logo" className="h-9 w-9 text-brand-blue" />
        <span className="text-xl font-black text-[#0A1628]">Laundry Express</span>
      </button>

      <nav className="space-y-2" aria-label="Navigation chauffeur">
        {items.map((item) => {
          const active = activeSection === item.section;
          return (
            <button
              key={item.section}
              onClick={() => onSectionChange(item.section)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                active ? 'bg-[#eef6ff] text-brand-blue' : 'text-[#20314d] hover:bg-[#f7faff]'
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <DriverReferralCard className="mt-auto" />
    </aside>
  );
};

const DriverReferralCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { addNotification } = useAppContext();
  return (
    <section className={`rounded-2xl bg-gradient-to-br from-[#eef6ff] to-white p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-black text-brand-blue">Parrainez un chauffeur</h3>
      <p className="mt-2 text-xs text-[#52607f]">Gagnez 5% de chaque mission</p>
      <img src={REFERRAL_IMAGE} alt="Sac de pièces et progression de gains Laundry Express" className="mx-auto my-4 h-24 w-full object-contain" />
      <button
        onClick={() => {
          addNotification('Lien de parrainage prêt à partager.', 'success');
          window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_referral_clicked' } }));
        }}
        className="w-full rounded-xl border border-brand-blue px-4 py-2 text-sm font-black text-brand-blue transition hover:bg-brand-blue hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-100"
      >
        Inviter maintenant
      </button>
    </section>
  );
};

const DriverTopbar: React.FC<{
  driverName: string;
  avatarUrl?: string;
  onMenuClick: () => void;
}> = ({ driverName, avatarUrl, onMenuClick }) => (
  <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e4edf9] bg-white/95 px-4 backdrop-blur lg:hidden">
    <button onClick={onMenuClick} className="rounded-xl p-2 text-[#52607f] hover:bg-[#f1f7ff] lg:hidden" aria-label="Ouvrir le menu chauffeur">
      <Icon name="bars3" className="h-6 w-6" />
    </button>
    <div className="flex items-center gap-3 sm:gap-5">
      <button className="hidden rounded-lg bg-brand-blue px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-100 sm:flex sm:items-center sm:gap-2">
        <Icon name="logo" className="h-4 w-4" />
        Tableau de bord
      </button>
      <button className="hidden rounded-xl border border-[#dbe7fb] bg-white px-4 py-2 text-sm font-bold text-[#20314d] sm:flex sm:items-center sm:gap-2">
        Français
        <Icon name="chevron-down" className="h-4 w-4" />
      </button>
      <button className="rounded-full p-2 text-[#20314d] hover:bg-[#f1f7ff]" aria-label="Changer le thème">
        <Icon name="moon" className="h-5 w-5" />
      </button>
      <button className="relative rounded-full p-2 text-[#20314d] hover:bg-[#f1f7ff]" aria-label="Notifications">
        <Icon name="bell" className="h-5 w-5" />
        <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">3</span>
      </button>
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`Avatar de ${driverName}`} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-sm font-black text-white">
            {driverName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden text-sm text-[#20314d] sm:inline">Bonjour, {driverName}</span>
        <Icon name="chevron-down" className="hidden h-4 w-4 text-[#52607f] sm:block" />
      </div>
    </div>
  </header>
);

const DriverKpiCards: React.FC<{ stats: DriverStats; rating: number; reviewCount: number }> = ({ stats, rating, reviewCount }) => {
  const cards = [
    { label: 'Missions terminées', value: String(stats.completedToday), sub: "Aujourd'hui", icon: 'check' as const, tone: 'bg-blue-100 text-brand-blue' },
    { label: 'Gains totaux (est.)', value: formatMoney(stats.totalEstimatedEarnings), sub: 'Total à ce jour', icon: 'currencyDollar' as const, tone: 'bg-green-100 text-green-600' },
    { label: 'Gains cette semaine', value: formatMoney(stats.weeklyEarnings), sub: `${stats.weeklyMissionCount} mission${stats.weeklyMissionCount > 1 ? 's' : ''}`, icon: 'calendar' as const, tone: 'bg-violet-100 text-violet-600' },
    { label: 'Note moyenne', value: rating.toFixed(2), sub: `${reviewCount} avis`, icon: 'star' as const, tone: 'bg-orange-100 text-orange-500', stars: true },
  ];

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs chauffeur">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl border border-[#e4edf9] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
          <div className="flex items-center gap-5">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${card.tone}`}>
              <Icon name={card.icon} className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[#52607f]">{card.label}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-3xl font-black text-[#0A1628]">{card.value}</p>
                {card.stars && <span className="text-sm text-[#ffb703]">★★★★★</span>}
              </div>
              <p className="mt-2 text-sm text-[#6c7894]">{card.sub}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
};

export const DriverStatusCard: React.FC<{
  available: boolean;
  isUpdating: boolean;
  onToggle: () => void;
}> = ({ available, isUpdating, onToggle }) => (
  <section className="relative overflow-hidden rounded-2xl border border-[#e4edf9] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
    <div className="grid gap-6 md:grid-cols-[1fr_260px] md:items-center">
      <div>
        <h2 className="text-base font-black text-[#0A1628]">Mon statut</h2>
        <div className="mt-6 flex items-center gap-3">
          <span className={`h-4 w-4 rounded-full ${available ? 'bg-green-500' : 'bg-slate-300'} ring-4 ${available ? 'ring-green-100' : 'ring-slate-100'}`} />
          <p className={`text-2xl font-black ${available ? 'text-green-600' : 'text-slate-500'}`}>
            {available ? 'Disponible' : 'Indisponible'}
          </p>
        </div>
        <p className="mt-3 max-w-xl text-sm text-[#52607f]">
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
    <section className="rounded-2xl border border-[#cfe2fb] bg-[#eef6ff] p-6 shadow-[0_16px_40px_rgba(0,102,204,0.08)]">
      <div className="grid gap-6 md:grid-cols-[1fr_180px] md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <Icon name="sparkles" className="h-6 w-6 text-brand-blue" />
            <h2 className="font-black text-brand-blue">Astuces pour recevoir plus de missions</h2>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-[#20314d]">
            {[
              'Rendez-vous disponible pendant les heures de pointe',
              'Maintenez un taux d’acceptation élevé',
              'Respectez les délais de livraison',
              'Gardez votre note au-dessus de 4.5',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <Icon name="check" className="mt-0.5 h-4 w-4 rounded-full bg-white text-brand-blue" />
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
          <p className="mt-2 text-sm font-black text-[#20314d]">Taux d’acceptation</p>
          <p className="text-sm text-[#52607f]">{accepted} / {offered} missions</p>
        </div>
      </div>
    </section>
  );
};

export const ActiveMissionCard: React.FC<{
  mission: LogisticsTask | null;
  available: boolean;
  onOpenMissions: () => void;
  onChat: () => void;
  onAction: () => void;
  isUpdating: boolean;
}> = ({ mission, available, onOpenMissions, onChat, onAction, isUpdating }) => {
  if (!mission) {
    return (
      <section className="rounded-2xl border border-dashed border-[#b8cce6] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef6ff] text-brand-blue">
              <Icon name="truck" className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0A1628]">Aucune mission active</h2>
              <p className="mt-2 max-w-xl text-sm text-[#52607f]">
                Vous êtes actuellement libre. Vous serez notifié quand une nouvelle mission sera disponible.
              </p>
            </div>
          </div>
          <button onClick={onOpenMissions} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-blue px-5 py-3 text-sm font-black text-brand-blue transition hover:bg-brand-blue hover:text-white">
            Voir les missions disponibles
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>
        {!available && <p className="mt-4 text-sm font-semibold text-orange-600">Passez disponible pour recevoir de nouvelles propositions.</p>}
      </section>
    );
  }

  const actionLabel = mission.status === 'driver_assigned' ? 'Accepter' : mission.status === 'accepted' ? 'Démarrer' : 'Marquer terminée';
  return (
    <section className="rounded-2xl border border-[#dbe7fb] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-brand-blue">Mission active</p>
          <h2 className="mt-2 text-2xl font-black text-[#0A1628]">#{mission.order_number || mission.order_id?.slice(0, 8) || mission.id.slice(0, 8)}</h2>
          <p className="mt-1 text-sm text-[#52607f]">{mission.task_type === 'pickup' ? 'Collecte' : 'Livraison'} · {getTaskStatusLabel(mission.status)}</p>
        </div>
        <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">Gain estimé {formatMoney(MONEY_PER_MISSION)}</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MissionInfo icon="user" label="Client" value={getTaskClientName(mission)} />
        <MissionInfo icon="mapPin" label="Départ" value={getTaskPickupAddress(mission)} />
        <MissionInfo icon="mapPin" label="Arrivée" value={getTaskDeliveryAddress(mission)} />
        <MissionInfo icon="clock" label="ETA" value={mission.scheduled_at ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Bientôt disponible'} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button onClick={onChat} className="flex-1 rounded-xl border border-[#dbe7fb] px-4 py-3 text-sm font-black text-[#20314d] hover:bg-[#f7faff]">Voir détails</button>
        <button onClick={onAction} disabled={isUpdating} className="flex-1 rounded-xl bg-brand-blue px-4 py-3 text-sm font-black text-white hover:bg-brand-blue-700 disabled:cursor-wait disabled:opacity-60">
          {isUpdating ? 'Traitement...' : actionLabel}
        </button>
        <a href={`tel:${getTaskPhone(mission)}`} className="flex-1 rounded-xl border border-[#dbe7fb] px-4 py-3 text-center text-sm font-black text-[#20314d] hover:bg-[#f7faff]">Appeler client</a>
        <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getTaskDeliveryAddress(mission))}`, '_blank')} className="flex-1 rounded-xl border border-[#dbe7fb] px-4 py-3 text-sm font-black text-[#20314d] hover:bg-[#f7faff]">Ouvrir carte</button>
      </div>
    </section>
  );
};

const MissionInfo: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl bg-[#f8fbff] p-4">
    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#6c7894]">
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </div>
    <p className="mt-2 text-sm font-bold text-[#20314d]">{value || 'Bientôt disponible'}</p>
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
    <section className="rounded-2xl border border-[#e4edf9] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0A1628]">Historique des missions</h2>
          <p className="mt-4 text-sm font-bold text-[#20314d]">Missions quotidiennes ({range === '7' ? '7' : range === '90' ? '90' : '30'} derniers jours)</p>
        </div>
        <select value={range} onChange={(event) => onRangeChange(event.target.value)} className="rounded-xl border border-[#dbe7fb] bg-white px-4 py-2 text-sm font-bold text-[#20314d] focus:outline-none focus:ring-4 focus:ring-blue-100">
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>
      <div className="mt-5 flex items-center justify-end gap-5 text-xs text-[#52607f]">
        <Legend color="#22C55E" label="Terminées" />
        <Legend color="#EF4444" label="Annulées" />
        <Legend color="#64748B" label="Rejetées" />
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
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
        <div className="mt-4 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] px-4 py-3 text-sm text-[#52607f]">
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
    <section className="rounded-2xl border border-[#e4edf9] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-[#0A1628]">Résumé des gains</h2>
        <select className="rounded-xl border border-[#dbe7fb] bg-white px-3 py-2 text-xs font-bold text-[#20314d]">
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
              <span className="text-sm text-[#20314d]">{label}</span>
            </div>
            <span className="font-black text-[#0A1628]">{formatMoney(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t border-[#e4edf9] pt-5">
        <div className="flex items-center justify-between">
          <span className="font-black text-[#0A1628]">Total estimé</span>
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
  <section className="rounded-2xl border border-[#e4edf9] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-black text-[#0A1628]">Missions disponibles</h2>
      <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-black text-brand-blue">{missions.length}</span>
    </div>
    <div className="mt-5 space-y-3">
      {missions.length ? missions.map((mission) => (
        <div key={mission.id} className="grid gap-3 rounded-xl border border-[#e4edf9] p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-black text-[#0A1628]">#{mission.order_number || mission.order_id.slice(0, 8)}</p>
            <p className="text-sm text-[#52607f]">{mission.task_type === 'pickup' ? 'Collecte' : 'Livraison'} · {mission.pickup_commune || mission.delivery_commune || 'Kinshasa'} · {formatMoney(MONEY_PER_MISSION)}</p>
          </div>
          <button onClick={() => onAccept(mission)} disabled={isUpdating} className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700 disabled:cursor-wait disabled:opacity-60">
            Accepter
          </button>
        </div>
      )) : (
        <p className="rounded-xl bg-[#f8fbff] p-4 text-sm text-[#52607f]">Aucune mission disponible pour le moment.</p>
      )}
    </div>
  </section>
);

export const DriverDashboardPage: React.FC = () => {
  const {
    user,
    getOrdersForDriver,
    getCompletedOrdersForDriver,
    updateUser,
    updateOrderStatus,
    addNotification,
    setCurrentPage,
    openDriverMissionForOrderId,
    setOpenDriverMissionForOrderId,
  } = useAppContext();
  const [activeSection, setActiveSection] = useState<DriverSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [chattingOrder, setChattingOrder] = useState<Order | null>(null);
  const [liveTasks, setLiveTasks] = useState<LogisticsTask[]>([]);
  const [liveDriver, setLiveDriver] = useState<LogisticsDriver | null>(null);
  const [historyRange, setHistoryRange] = useState('30');
  const missionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_dashboard_viewed' } }));
  }, []);

  useEffect(() => {
    if (openDriverMissionForOrderId) {
      setTimeout(() => missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      setOpenDriverMissionForOrderId(null);
    }
  }, [openDriverMissionForOrderId, setOpenDriverMissionForOrderId]);

  useEffect(() => {
    let isMounted = true;
    const loadDriverData = async () => {
      if (!user || user.role !== 'driver') return;
      try {
        const [tasksResponse, driversResponse] = await Promise.all([
          realApi.getLogisticsTasks({ page: 1, page_size: 100 }),
          realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
        ]);
        if (!isMounted) return;
        setLiveTasks(tasksResponse.tasks || []);
        setLiveDriver((driversResponse.drivers || []).find((driver) => driver.user_id === user.id || driver.user_email === user.email) || null);
      } catch {
        if (isMounted) {
          setLiveTasks([]);
          setLiveDriver(null);
        }
      }
    };
    loadDriverData();
    const poll = window.setInterval(loadDriverData, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(poll);
    };
  }, [user]);

  const localCompletedOrders = useMemo(() => (user ? getCompletedOrdersForDriver(user.id) : []), [user, getCompletedOrdersForDriver]);
  const localCurrentOrder = useMemo(() => (user ? getOrdersForDriver(user.id) : null), [user, getOrdersForDriver]);

  const activeTask = useMemo(() => liveTasks.find((task) => ['driver_assigned', 'accepted', 'in_progress'].includes(task.status)) || null, [liveTasks]);
  const availableTasks = useMemo(() => liveTasks.filter((task) => ['pending', 'open_market', 'claimed'].includes(task.status)).slice(0, 5), [liveTasks]);
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
        await realApi.updateDriverAvailability(nextAvailable);
      } catch {
        // Keep the dashboard usable while older backends catch up with /driver/availability.
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

  const handleMissionAction = async () => {
    setIsUpdating(true);
    try {
      if (activeTask) {
        const updatedTask = activeTask.status === 'driver_assigned'
          ? await realApi.acceptLogisticsTask(activeTask.id)
          : activeTask.status === 'accepted'
            ? await realApi.startLogisticsTask(activeTask.id)
            : await realApi.completeLogisticsTask(activeTask.id);
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

  const handleAcceptMission = async (mission: LogisticsTask) => {
    setIsUpdating(true);
    try {
      const updated = await realApi.acceptLogisticsTask(mission.id);
      setLiveTasks((tasks) => tasks.map((task) => task.id === updated.id ? updated : task));
      addNotification('Mission acceptée.', 'success');
      window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_mission_accepted', missionId: mission.id } }));
    } catch {
      addNotification('Impossible d’accepter cette mission.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || user.role !== 'driver') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f8fbff] p-6">
        <div className="rounded-2xl border border-[#e4edf9] bg-white p-8 text-center shadow-sm">
          <Icon name="truck" className="mx-auto h-12 w-12 text-brand-blue" />
          <h1 className="mt-4 text-2xl font-black text-[#0A1628]">Accès chauffeur uniquement</h1>
          <p className="mt-2 text-[#52607f]">Connectez-vous avec un compte chauffeur pour ouvrir ce tableau de bord.</p>
        </div>
      </div>
    );
  }

  const driverName = user.name?.split(' ')[0] || 'Driver';

  return (
    <div className="min-h-screen bg-[#f8fbff] text-[#0A1628]">
      <DriverSidebar activeSection={activeSection} onSectionChange={setActiveSection} onNavigate={setCurrentPage} />
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="h-full w-[280px] bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <DriverSidebar mobile activeSection={activeSection} onSectionChange={(section) => { setActiveSection(section); setIsSidebarOpen(false); }} onNavigate={setCurrentPage} />
          </div>
        </div>
      )}
      <DriverTopbar driverName={driverName} avatarUrl={(user as { avatarUrl?: string }).avatarUrl} onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="px-4 py-6 lg:ml-[260px] lg:px-8">
        <div className="mx-auto max-w-[1500px] space-y-6">
          <section>
            <h1 className="text-3xl font-black tracking-normal text-[#0A1628]">Tableau de bord chauffeur 👋</h1>
            <p className="mt-2 text-[#52607f]">Bienvenue, {driverName} ! Voici un aperçu de votre activité.</p>
          </section>

          <DriverKpiCards stats={stats} rating={rating} reviewCount={reviewCount} />

          <div className="grid gap-6 xl:grid-cols-[1fr_0.98fr]">
            <DriverStatusCard available={available} isUpdating={isUpdating} onToggle={handleAvailabilityToggle} />
            <DriverTipsCard acceptanceRate={stats.acceptanceRate} accepted={stats.acceptedMissions} offered={stats.offeredMissions} />
          </div>

          <div ref={missionRef}>
            <ActiveMissionCard
              mission={activeTask}
              available={available}
              onOpenMissions={() => {
                setActiveSection('missions');
                window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_available_missions_clicked' } }));
              }}
              onChat={() => {
                if (activeMissionOrder) {
                  setChattingOrder(activeMissionOrder);
                  window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_active_mission_viewed' } }));
                }
              }}
              onAction={handleMissionAction}
              isUpdating={isUpdating}
            />
          </div>

          {activeSection === 'missions' && <AvailableMissionsList missions={availableTasks} onAccept={handleAcceptMission} isUpdating={isUpdating} />}

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <MissionHistoryChart data={missionHistoryChartData} range={historyRange} onRangeChange={setHistoryRange} />
            <DriverEarningsSummary
              breakdown={earningsBreakdown}
              onOpen={() => {
                setActiveSection('earnings');
                window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'driver_earnings_clicked' } }));
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['documents', 'Documents', 'Permis, assurance et pièces vérifiées.', 'document-text'],
              ['support', 'Support', 'Assistance disponible à tout moment.', 'lifebuoy'],
              ['availability', 'Disponibilité', 'Planifiez vos créneaux de travail.', 'calendar'],
              ['settings', 'Paramètres', 'Préférences du compte chauffeur.', 'pencil'],
            ].map(([section, title, description, icon]) => (
              <button key={section} onClick={() => setActiveSection(section as DriverSection)} className="rounded-2xl border border-[#e4edf9] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100">
                <Icon name={icon as any} className="h-6 w-6 text-brand-blue" />
                <h3 className="mt-4 font-black text-[#0A1628]">{title}</h3>
                <p className="mt-2 text-sm text-[#52607f]">{description}</p>
              </button>
            ))}
          </div>

          <div className="lg:hidden">
            <DriverReferralCard />
          </div>
        </div>
      </main>

      <button
        onClick={handleAvailabilityToggle}
        disabled={isUpdating}
        className="fixed bottom-4 left-4 right-4 z-30 rounded-2xl bg-brand-blue py-4 text-sm font-black text-white shadow-2xl shadow-blue-200 disabled:opacity-60 lg:hidden"
      >
        {available ? 'Passer indisponible' : 'Devenir disponible'}
      </button>

      <ChatModal isOpen={!!chattingOrder} onClose={() => setChattingOrder(null)} order={chattingOrder} />
    </div>
  );
};
