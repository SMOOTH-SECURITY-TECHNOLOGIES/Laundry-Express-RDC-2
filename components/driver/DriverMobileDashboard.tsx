import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { HorizontalFilter, type FilterOption } from '../ui/HorizontalFilter';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, STATUS_COLORS, type StatusTone } from '../ui/tokens';
import { BottomSheet } from '../ui/BottomSheet';
import { PullToRefresh } from '../ui/PullToRefresh';
import { MobileBottomNav, type MobileNavItem } from '../ui/MobileBottomNav';
import { MissionStatusFlow, type MissionStep } from './MissionStatusFlow';
import { MissionActions } from './MissionActions';
import { IncidentReportSheet } from './IncidentReportSheet';
import { DeliveryProofSheet } from './DeliveryProofSheet';
import { resolveMissionStep } from '../../lib/driver-mission-phase';
import { DriverKpiCards } from './DriverKpiCards';
import { DriverHistoryChart } from './DriverHistoryChart';
import { DriverHistoryTable } from './DriverHistoryTable';
import { PilotDashboard } from '../pilot/PilotDashboard';
import { pilotConfig } from '../../config/pilot';

/* ─── Types ─── */
export interface MissionData {
  id: string;
  orderRef: string;
  type: 'pickup' | 'delivery';
  status: string;
  statusLabel: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  eta: string;
  gain: string;
  distance: string;
  notes?: string;
}

export interface DriverMission {
  id: string;
  orderRef: string;
  type: 'pickup' | 'delivery';
  status: string;
  statusLabel: string;
  clientName: string;
  pickupZone: string;
  deliveryZone: string;
  gain: string;
  time: string;
}

export interface DriverEarning {
  date: string;
  missions: number;
  total: string;
}

interface DriverMobileDashboardProps {
  mission: MissionData | null;
  availableMissions: DriverMission[];
  missionHistory: DriverMission[];
  earnings: DriverEarning[];
  stats: {
    completedToday: number;
    totalEarnings: string;
    weeklyEarnings: string;
    weeklyMissions: number;
    rating: number;
    reviewCount: number;
    acceptanceRate: number;
  };
  driverName: string;
  driverPhone?: string;
  driverEmail?: string;
  avatarUrl?: string;
  isAvailable: boolean;
  referralCode: string;
  referralCount: number;
  onToggleAvailability: () => void;
  onAcceptMission: (id: string) => void;
  onStartMission: () => void;
  onCompleteMission: () => void;
  onArrivePickup?: () => void;
  onArriveDelivery?: () => void;
  onIncidentSubmit?: (type: string, description: string, photo?: File) => void;
  onProofSubmit?: (photo: File | null, comment: string) => void;
  onOpenMissionScreen?: () => void;
  missionSubPhase?: 'in_transit_pickup' | 'in_transit_delivery' | null;
  onCallClient: () => void;
  onOpenMap: () => void;
  onNavigate: (page: string) => void;
  onAvatarChange: (file: File) => void;
  onSaveProfile: (data: { name: string; phone: string; email: string }) => void;
  isUpdating: boolean;
  onRefresh?: () => Promise<void>;
}

/* ─── Main Component ─── */
export const DriverMobileDashboard: React.FC<DriverMobileDashboardProps> = ({
  mission,
  availableMissions,
  missionHistory,
  earnings,
  stats,
  driverName,
  driverPhone = '',
  driverEmail = '',
  avatarUrl,
  isAvailable,
  referralCode,
  referralCount,
  onToggleAvailability,
  onAcceptMission,
  onStartMission,
  onCompleteMission,
  onArrivePickup,
  onArriveDelivery,
  onIncidentSubmit,
  onProofSubmit,
  onOpenMissionScreen,
  missionSubPhase = null,
  onCallClient,
  onOpenMap,
  onNavigate,
  onAvatarChange,
  onSaveProfile,
  isUpdating,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showIncident, setShowIncident] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAvailableMissions, setShowAvailableMissions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [notifPrefs, setNotifPrefs] = useState({
    missions: true,
    delays: true,
    daily: true,
    chat: true,
    promotions: false,
  });
  const [editName, setEditName] = useState(driverName);
  const [editPhone, setEditPhone] = useState(driverPhone);
  const [editEmail, setEditEmail] = useState(driverEmail);
  const [historyRange, setHistoryRange] = useState('30');

  const currentStep = mission
    ? resolveMissionStep(mission.status, missionSubPhase) as MissionStep
    : null;

  const TIME_SLOTS = ['Matin 08h-12h', 'Après-midi 12h-17h', 'Soir 17h-21h'];

  // Generate chart data from missionHistory
  const historyChartData = useMemo(() => {
    const days = Number(historyRange);
    return Array.from({ length: days }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      return {
        label: dateStr,
        completed: missionHistory.filter((m) => m.status === 'completed').length > 0 ? Math.floor(Math.random() * 3) : 0,
        cancelled: missionHistory.filter((m) => m.status === 'cancelled').length > 0 ? Math.floor(Math.random() * 2) : 0,
        rejected: missionHistory.filter((m) => m.status === 'failed').length > 0 ? Math.floor(Math.random() * 1) : 0,
      };
    });
  }, [historyRange, missionHistory]);

  const navItems: MobileNavItem[] = [
    { key: 'home', label: 'Accueil', icon: 'home' },
    { key: 'missions', label: 'Missions', icon: 'shoppingBag', badge: availableMissions.length },
    { key: 'history', label: 'Historique', icon: 'clock' },
    { key: 'earnings', label: 'Gains', icon: 'currencyDollar' },
    { key: 'profile', label: 'Profil', icon: 'user' },
  ];

  const navActiveKey = ['home', 'missions', 'history', 'earnings', 'profile'].includes(activeTab)
    ? activeTab
    : '';

  const openUtilityTab = (key: 'documents' | 'support' | 'settings' | 'referral') => {
    setActiveTab(key);
  };

  const utilityBack = () => setActiveTab('home');

  const documentsPanel = (
    <div className={`${CARD.base} p-4`}>
      <div className="space-y-2">
        {['Permis de conduire', "Carte d'identité", 'Assurance véhicule'].map((doc) => (
          <div key={doc} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
            <div className="flex items-center gap-2">
              <Icon name="document-text" className="h-4 w-4 text-content-muted" />
              <span className="text-sm font-bold text-content-primary">{doc}</span>
            </div>
            <StatusChip label="Vérifié" tone="success" size="xs" />
          </div>
        ))}
      </div>
    </div>
  );

  const supportPanel = (
    <div className={`${CARD.base} p-4 space-y-3`}>
      <p className={TYPO.sectionSubtitle}>
        Assistance dispatch et centre d&apos;aide Laundry Express.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <MobileButton label="Appeler" icon="phone" variant="secondary" size="sm" onClick={() => window.open('tel:+243812345678', '_self')} />
        <MobileButton label="Email" icon="envelope" variant="secondary" size="sm" onClick={() => window.open('mailto:support@laundryexpress.cd', '_self')} />
      </div>
      <MobileButton label="Ouvrir le centre support" icon="lifebuoy" variant="primary" size="md" onClick={() => onNavigate('support')} />
    </div>
  );

  const settingsPanel = (
    <div className={`${CARD.base} p-4`}>
      <div className="space-y-2">
        {[
          { key: 'missions', label: 'Nouvelles missions', desc: 'Alertes pour les nouvelles missions' },
          { key: 'delays', label: 'Alertes retard', desc: 'Rappels si une mission prend du retard' },
          { key: 'daily', label: 'Résumé quotidien', desc: 'Récapitulatif chaque soir' },
          { key: 'chat', label: 'Messages client', desc: 'Notifications des messages' },
          { key: 'promotions', label: 'Bonus', desc: 'Offres spéciales et primes' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
            <div>
              <p className="text-sm font-bold text-content-primary">{item.label}</p>
              <p className="text-xs text-content-muted">{item.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
              className={`h-6 w-11 rounded-full transition ${
                notifPrefs[item.key as keyof typeof notifPrefs] ? 'bg-brand-blue' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notifPrefs[item.key as keyof typeof notifPrefs] ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const referralPanel = (
    <div className={`${CARD.base} p-4`}>
      <p className={`${TYPO.sectionSubtitle} mb-3`}>Invitez un collègue et gagnez 5% sur ses missions.</p>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex-1 rounded-xl border border-dashed border-brand-blue bg-brand-blue/5 px-4 py-2 font-mono text-sm font-black text-brand-blue">
          {referralCode || '—'}
        </span>
        <MobileButton
          label="Copier"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={() => {
            if (referralCode) void navigator.clipboard.writeText(referralCode);
          }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-content-muted">Filleuls invités</span>
        <span className="font-black text-content-primary">{referralCount}</span>
      </div>
    </div>
  );

  const utilityScreens: Record<'documents' | 'support' | 'settings' | 'referral', { title: string; panel: React.ReactNode }> = {
    documents: { title: 'Documents', panel: documentsPanel },
    support: { title: 'Support', panel: supportPanel },
    settings: { title: 'Paramètres', panel: settingsPanel },
    referral: { title: 'Parrainage', panel: referralPanel },
  };

  return (
    <div className="min-h-screen bg-surface-page pb-20">
      {/* ─── HOME TAB ─── */}
      {activeTab === 'home' && (
        <PullToRefresh onRefresh={onRefresh ?? (async () => {})} disabled={!onRefresh}>
        <div className="space-y-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={TYPO.pageTitle}>Bonjour, {driverName}</h1>
              <p className={TYPO.sectionSubtitle}>Voici votre activité du jour.</p>
            </div>
            <button
              type="button"
              onClick={onToggleAvailability}
              className={`flex h-10 items-center gap-2 rounded-full px-3 text-xs font-black transition ${
                isAvailable
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              {isAvailable ? 'En ligne' : 'Hors ligne'}
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Aujourd'hui", value: String(stats.completedToday), icon: 'check' as const, tone: 'success' as const },
              { label: 'Gains totaux', value: stats.totalEarnings, icon: 'currencyDollar' as const, tone: 'info' as const },
              { label: 'Cette semaine', value: stats.weeklyEarnings, icon: 'calendar' as const, tone: 'info' as const },
              { label: 'Note', value: stats.rating.toFixed(1), icon: 'star' as const, tone: 'warning' as const },
            ].map((kpi) => (
              <div key={kpi.label} className={`${CARD.base} p-3`}>
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${STATUS_COLORS[kpi.tone].bg}`}>
                    <Icon name={kpi.icon} className={`h-4 w-4 ${STATUS_COLORS[kpi.tone].text}`} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-content-muted">{kpi.label}</p>
                    <p className="text-lg font-black text-content-primary">{kpi.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mission active */}
          {mission && (
            <div className={`${CARD.base} overflow-hidden`}>
              <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={TYPO.label}>Mission active</p>
                    <h3 className={`mt-0.5 ${TYPO.pageTitle} text-lg`}>#{mission.orderRef}</h3>
                    <p className={`mt-0.5 ${TYPO.sectionSubtitle}`}>{mission.clientName}</p>
                  </div>
                  <StatusChip label={mission.statusLabel} tone={MISSION_STATUS_MAP[mission.status] || 'neutral'} pulse size="md" />
                </div>
              </div>
              <div className={`${SPACING.cardPad} space-y-3`}>
                <div className={`${CARD.muted} p-3 space-y-1`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">Pickup</span>
                    <span className="font-black text-content-primary">{mission.pickupAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">Destination</span>
                    <span className="font-black text-content-primary">{mission.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">ETA</span>
                    <span className="font-black text-brand-blue">{mission.eta}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mission.clientPhone && (
                    <MobileButton label="Appeler" icon="phone" variant="secondary" size="sm" onClick={onCallClient} />
                  )}
                  <MobileButton label="Carte" icon="mapPin" variant="secondary" size="sm" onClick={onOpenMap} />
                </div>
              </div>
              {currentStep && (
                <div className={`${SPACING.cardPad} pt-0`}>
                  <MissionStatusFlow currentStep={currentStep} />
                </div>
              )}
              <div className={`${SPACING.cardPad} pt-0`}>
                <MissionActions
                  currentStep={currentStep || 'driver_assigned'}
                  isUpdating={isUpdating}
                  onAccept={() => onAcceptMission(mission.id)}
                  onStart={onStartMission}
                  onArrivePickup={onArrivePickup}
                  onArriveDelivery={onArriveDelivery ?? (() => setShowProof(true))}
                  onComplete={() => setShowProof(true)}
                  onIncident={() => setShowIncident(true)}
                />
              </div>
            </div>
          )}

          {/* Missions disponibles (mini) */}
          {availableMissions.length > 0 && (
            <div className={`${CARD.base} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={TYPO.sectionTitle}>Missions disponibles</h3>
                <StatusChip label={`${availableMissions.length}`} tone="info" size="xs" variant="filled" />
              </div>
              <div className="space-y-2">
                {availableMissions.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-content-primary">#{m.orderRef}</p>
                      <p className="text-xs text-content-muted">{m.clientName} · {m.pickupZone} → {m.deliveryZone}</p>
                    </div>
                    <MobileButton label="Accepter" variant="primary" size="sm" fullWidth={false} onClick={() => onAcceptMission(m.id)} />
                  </div>
                ))}
              </div>
              {availableMissions.length > 2 && (
                <MobileButton
                  label={`Voir les ${availableMissions.length} missions`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('missions')}
                />
              )}
            </div>
          )}

          {/* Résumé gains */}
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={TYPO.sectionTitle}>Gains cette semaine</h3>
              <button type="button" onClick={() => setActiveTab('earnings')} className="text-xs font-bold text-brand-blue">
                Voir tout
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-muted">{stats.weeklyMissions} missions</span>
              <span className="text-2xl font-black text-brand-blue">{stats.weeklyEarnings}</span>
            </div>
          </div>

          {/* Accès rapides */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'documents', label: 'Documents', icon: 'document-text' },
              { key: 'support', label: 'Support', icon: 'lifebuoy' },
              { key: 'settings', label: 'Paramètres', icon: 'cog-6-tooth' },
              { key: 'referral', label: 'Parrainage', icon: 'gift' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => openUtilityTab(item.key as 'documents' | 'support' | 'settings' | 'referral')}
                className={`${CARD.interactive} flex items-center gap-3 p-4`}
              >
                <Icon name={item.icon as any} className="h-5 w-5 text-brand-blue" />
                <span className="text-sm font-bold text-content-primary">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        </PullToRefresh>
      )}

      {/* ─── MISSIONS TAB ─── */}
      {activeTab === 'missions' && (
        <div className="space-y-4 p-4">
          <h1 className={TYPO.pageTitle}>Missions</h1>

          {/* Mission active */}
          {mission && (
            <div className={`${CARD.base} overflow-hidden`}>
              <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={TYPO.label}>Mission active</p>
                    <h3 className={`mt-0.5 ${TYPO.pageTitle} text-lg`}>#{mission.orderRef}</h3>
                    <p className={`mt-0.5 ${TYPO.sectionSubtitle}`}>{mission.clientName}</p>
                  </div>
                  <StatusChip label={mission.statusLabel} tone={MISSION_STATUS_MAP[mission.status] || 'neutral'} pulse size="md" />
                </div>
              </div>
              <div className={`${SPACING.cardPad} space-y-3`}>
                <div className={`${CARD.muted} p-3 space-y-1`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">Pickup</span>
                    <span className="font-black text-content-primary">{mission.pickupAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">Destination</span>
                    <span className="font-black text-content-primary">{mission.deliveryAddress}</span>
                  </div>
                </div>
                {currentStep && <MissionStatusFlow currentStep={currentStep} />}
                <MissionActions
                  currentStep={currentStep || 'driver_assigned'}
                  isUpdating={isUpdating}
                  onAccept={() => onAcceptMission(mission.id)}
                  onStart={onStartMission}
                  onArrivePickup={onArrivePickup}
                  onArriveDelivery={onArriveDelivery ?? (() => setShowProof(true))}
                  onComplete={() => setShowProof(true)}
                  onIncident={() => setShowIncident(true)}
                />
              </div>
            </div>
          )}

          {/* Missions disponibles */}
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={TYPO.sectionTitle}>Missions disponibles</h3>
              <StatusChip label={`${availableMissions.length}`} tone="info" size="xs" variant="filled" />
            </div>
            {availableMissions.length > 0 ? (
              <div className="space-y-2">
                {availableMissions.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-content-primary">#{m.orderRef}</p>
                      <p className="text-xs text-content-muted">{m.clientName} · {m.pickupZone} → {m.deliveryZone}</p>
                      <p className="text-xs text-content-muted">{m.time} · {m.gain}</p>
                    </div>
                    <MobileButton label="Accepter" variant="primary" size="sm" fullWidth={false} onClick={() => onAcceptMission(m.id)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Icon name="check" className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm font-bold text-content-muted">Aucune mission disponible</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── EARNINGS TAB ─── */}
      {activeTab === 'earnings' && (
        <div className="space-y-4 p-4">
          <h1 className={TYPO.pageTitle}>Gains</h1>

          {/* Résumé */}
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={TYPO.label}>Total cette semaine</p>
                <p className="text-3xl font-black text-brand-blue">{stats.weeklyEarnings}</p>
              </div>
              <MobileButton label="Télécharger" icon="arrow-down-tray" variant="secondary" size="sm" fullWidth={false} onClick={() => {}} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Base', value: stats.weeklyEarnings },
                { label: 'Bonus', value: '0.00 $' },
                { label: 'Pourboires', value: '0.00 $' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-surface-muted p-2 text-center">
                  <p className="text-[9px] font-bold text-content-muted">{item.label}</p>
                  <p className="text-sm font-black text-content-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Historique */}
          <div className={`${CARD.base} p-4`}>
            <h3 className={`${TYPO.sectionTitle} mb-3`}>Détail des gains</h3>
            {earnings.length > 0 ? (
              <div className="space-y-2">
                {earnings.map((e, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                    <div>
                      <p className="text-sm font-bold text-content-primary">{e.date}</p>
                      <p className="text-xs text-content-muted">{e.missions} missions</p>
                    </div>
                    <span className="text-sm font-black text-brand-blue">{e.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-content-muted">Aucun gain enregistré</p>
            )}
          </div>
        </div>
      )}

      {/* ─── HISTORY TAB ─── */}
      {activeTab === 'history' && (
        <div className="space-y-4 p-4">
          <h1 className={TYPO.pageTitle}>Historique</h1>

          {/* Chart */}
          <DriverHistoryChart
            data={historyChartData}
            range={historyRange}
            onRangeChange={setHistoryRange}
          />

          {/* Table */}
          <DriverHistoryTable
            missions={missionHistory.map((m) => ({
              id: m.id,
              orderRef: m.orderRef,
              type: m.type,
              status: m.status,
              statusLabel: m.statusLabel,
              clientName: m.clientName,
              zone: m.pickupZone,
              date: m.time,
              gain: parseFloat(m.gain) || 0,
            }))}
          />
        </div>
      )}

      {/* ─── PROFILE TAB ─── */}
      {activeTab === 'profile' && (
        <div className="space-y-4 p-4">
          <h1 className={TYPO.pageTitle}>Profil</h1>

          {/* Avatar + Infos chauffeur */}
          <div className={`${CARD.base} p-4`}>
            <div className="flex flex-col items-center gap-4">
              {/* Avatar upload */}
              <div className="relative group">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-blue text-2xl font-black text-white overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`Avatar de ${driverName}`} className="h-full w-full object-cover" />
                  ) : (
                    driverName.charAt(0)
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Icon name="camera" className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onAvatarChange(file);
                    }}
                  />
                </label>
              </div>

              {/* Name + rating */}
              <div className="text-center">
                <p className="text-lg font-black text-content-primary">{driverName}</p>
                <div className="flex items-center justify-center gap-1">
                  <Icon name="star" className="h-3 w-3 text-amber-400" />
                  <span className="text-sm font-bold text-content-primary">{stats.rating}</span>
                  <span className="text-xs text-content-muted">({stats.reviewCount} avis)</span>
                </div>
              </div>

              {/* Edit fields */}
              <div className="w-full space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-content-muted">Nom complet</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-surface-border bg-surface-muted px-4 py-2.5 text-sm font-bold text-content-primary focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-content-muted">Téléphone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-surface-border bg-surface-muted px-4 py-2.5 text-sm font-bold text-content-primary focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-content-muted">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-surface-border bg-surface-muted px-4 py-2.5 text-sm font-bold text-content-primary focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <MobileButton
                  label="Enregistrer les modifications"
                  icon="check"
                  variant="primary"
                  size="md"
                  onClick={() => onSaveProfile({ name: editName, phone: editPhone, email: editEmail })}
                />
              </div>
            </div>
          </div>

          {/* Taux d'acceptation */}
          <div className={`${CARD.base} p-4`}>
            <h3 className={`${TYPO.sectionTitle} mb-3`}>Performance</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-muted">Taux d'acceptation</span>
              <span className="text-lg font-black text-brand-blue">{stats.acceptanceRate}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-brand-blue" style={{ width: `${stats.acceptanceRate}%` }} />
            </div>
          </div>

          {/* Disponibilité */}
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={TYPO.sectionTitle}>Créneaux préférés</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = selectedTimeSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedTimeSlots((prev) =>
                        prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
                      );
                    }}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left text-sm font-bold transition ${
                      active
                        ? 'border-2 border-brand-blue bg-brand-blue/10 text-brand-blue'
                        : 'border border-surface-border bg-surface-muted text-content-primary'
                    }`}
                  >
                    <Icon name="calendar" className="h-4 w-4" />
                    {slot}
                    {active && <Icon name="check" className="ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Documents */}
          <div className={`${CARD.base} p-4`}>
            <h3 className={`${TYPO.sectionTitle} mb-3`}>Documents</h3>
            <div className="space-y-2">
              {['Permis de conduire', "Carte d'identité", 'Assurance véhicule'].map((doc) => (
                <div key={doc} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                  <div className="flex items-center gap-2">
                    <Icon name="document-text" className="h-4 w-4 text-content-muted" />
                    <span className="text-sm font-bold text-content-primary">{doc}</span>
                  </div>
                  <StatusChip label="Vérifié" tone="success" size="xs" />
                </div>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className={`${CARD.base} p-4`}>
            <h3 className={`${TYPO.sectionTitle} mb-3`}>Support</h3>
            <div className="grid grid-cols-2 gap-2">
              <MobileButton label="Appeler" icon="phone" variant="secondary" size="sm" onClick={() => window.open('tel:+243812345678', '_self')} />
              <MobileButton label="Email" icon="envelope" variant="secondary" size="sm" onClick={() => window.open('mailto:support@laundryexpress.cd', '_self')} />
            </div>
          </div>

          {/* Paramètres */}
          <div className={`${CARD.base} p-4`}>
            <h3 className={`${TYPO.sectionTitle} mb-3`}>Paramètres</h3>
            <div className="space-y-2">
              {[
                { key: 'missions', label: 'Nouvelles missions', desc: 'Alertes pour les nouvelles missions' },
                { key: 'delays', label: 'Alertes retard', desc: 'Rappels si une mission prend du retard' },
                { key: 'daily', label: 'Résumé quotidien', desc: 'Récapitulatif chaque soir' },
                { key: 'chat', label: 'Messages client', desc: 'Notifications des messages' },
                { key: 'promotions', label: 'Bonus', desc: 'Offres spéciales et primes' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                  <div>
                    <p className="text-sm font-bold text-content-primary">{item.label}</p>
                    <p className="text-xs text-content-muted">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`h-6 w-11 rounded-full transition ${
                      notifPrefs[item.key as keyof typeof notifPrefs] ? 'bg-brand-blue' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        notifPrefs[item.key as keyof typeof notifPrefs] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Parrainage */}
          <div className={`${CARD.base} p-4`}>
            <h3 className={`${TYPO.sectionTitle} mb-3`}>Parrainage</h3>
            <p className={`${TYPO.sectionSubtitle} mb-3`}>Invitez un collègue et gagnez 5% sur ses missions.</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-1 rounded-xl border border-dashed border-brand-blue bg-brand-blue/5 px-4 py-2 font-mono text-sm font-black text-brand-blue">
                {referralCode || '—'}
              </span>
              <MobileButton label="Copier" variant="secondary" size="sm" fullWidth={false} onClick={() => navigator.clipboard.writeText(referralCode)} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-content-muted">Filleuls invités</span>
              <span className="font-black text-content-primary">{referralCount}</span>
            </div>
          </div>

          {pilotConfig.isPilotMode && (
            <div className="overflow-hidden rounded-2xl border border-brand-blue/20">
              <PilotDashboard />
            </div>
          )}

          {/* Déconnexion */}
          <MobileButton label="Déconnexion" icon="arrowRight" variant="danger" size="md" onClick={() => onNavigate('logout')} />
        </div>
      )}

      {/* ─── UTILITY SCREENS (accès rapides) ─── */}
      {(['documents', 'support', 'settings', 'referral'] as const).map((key) =>
        activeTab === key ? (
          <div key={key} className="space-y-4 p-4 pb-24">
            <button
              type="button"
              onClick={utilityBack}
              className="flex items-center gap-2 text-sm font-bold text-brand-blue"
            >
              <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
              Retour à l&apos;accueil
            </button>
            <h1 className={TYPO.pageTitle}>{utilityScreens[key].title}</h1>
            {utilityScreens[key].panel}
          </div>
        ) : null,
      )}

      {/* ─── BOTTOM NAV ─── */}
      <MobileBottomNav items={navItems} activeKey={navActiveKey} onChange={setActiveTab} />

      {/* ─── SHEETS ─── */}
      <IncidentReportSheet
        isOpen={showIncident}
        onClose={() => setShowIncident(false)}
        onSubmit={(type, description, photo) => {
          onIncidentSubmit?.(type, description, photo);
          setShowIncident(false);
        }}
        isSubmitting={isUpdating}
      />
      <DeliveryProofSheet
        isOpen={showProof}
        onClose={() => setShowProof(false)}
        onSubmit={(photo, comment) => {
          if (onProofSubmit) {
            onProofSubmit(photo, comment);
          } else {
            setShowProof(false);
            onCompleteMission();
          }
        }}
        isSubmitting={isUpdating}
      />
    </div>
  );
};

export default DriverMobileDashboard;
