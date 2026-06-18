import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { HorizontalFilter, type FilterOption } from '../ui/HorizontalFilter';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, STATUS_COLORS, type StatusTone } from '../ui/tokens';
import { BottomSheet } from '../ui/BottomSheet';
import { DispatcherAssignSheet } from './DispatcherAssignSheet';

/* ─── Types ─── */
export interface DispatcherMission {
  id: string;
  orderRef: string;
  status: string;
  statusLabel: string;
  priority: 'normal' | 'high' | 'urgent';
  clientName: string;
  pickupZone: string;
  deliveryZone: string;
  distance: string;
  eta: string;
  queueMinutes: number;
  driverName?: string;
  driverPhone?: string;
}

export interface DispatcherDriver {
  id: string;
  name: string;
  zone: string;
  status: 'available' | 'busy';
  score: number;
  load: number;
  vehicleAvailable?: boolean;
}

interface DispatcherMobileDashboardProps {
  missions: DispatcherMission[];
  drivers: DispatcherDriver[];
  stats: {
    total: number;
    urgent: number;
    pending: number;
    active: number;
  };
  onSelectMission: (id: string) => void;
  onAssignDriver: (missionId: string, driverId: string) => void;
  onStartMission: (id: string) => void;
  onCompleteMission: (id: string) => void;
  onPrioritize: (id: string) => void;
  onCancel: (id: string) => void;
  onRefresh: () => void;
  onOpenTracking?: (missionId: string) => void;
  isSaving: boolean;
  resolveDriverScore?: (missionId: string, driver: DispatcherDriver) => number;
}

/* ─── Helpers ─── */
const PRIORITY_MAP: Record<string, StatusTone> = {
  urgent: 'danger',
  high: 'warning',
  normal: 'info',
};

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'urgent', label: 'Urgentes' },
  { key: 'pending', label: 'En attente' },
  { key: 'active', label: 'Actives' },
];

/* ─── Main Component ─── */
export const DispatcherMobileDashboard: React.FC<DispatcherMobileDashboardProps> = ({
  missions,
  drivers,
  stats,
  onSelectMission,
  onAssignDriver,
  onStartMission,
  onCompleteMission,
  onPrioritize,
  onCancel,
  onRefresh,
  onOpenTracking,
  isSaving,
  resolveDriverScore,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'urgent'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAssignSheet, setShowAssignSheet] = useState<string | null>(null);
  const [showDrivers, setShowDrivers] = useState(false);

  // Separate missions by tab
  const pendingMissions = useMemo(() =>
    missions.filter((m) => m.status === 'pending' || m.status === 'driver_assigned')
      .sort((a, b) => {
        const pScore: Record<string, number> = { urgent: 3, high: 2, normal: 1 };
        return (pScore[b.priority] || 0) - (pScore[a.priority] || 0) || b.queueMinutes - a.queueMinutes;
      }), [missions]);

  const activeMissions = useMemo(() =>
    missions.filter((m) => m.status === 'accepted' || m.status === 'in_progress'), [missions]);

  const urgentMissions = useMemo(() =>
    missions.filter((m) => m.priority === 'urgent' || m.queueMinutes >= 15)
      .sort((a, b) => b.queueMinutes - a.queueMinutes), [missions]);

  const availableDrivers = drivers.filter((d) => d.status === 'available');

  const assignCandidates = useMemo(() => {
    if (!showAssignSheet) return [];
    return availableDrivers
      .map((driver) => ({
        id: driver.id,
        name: driver.name,
        zone: driver.zone,
        status: driver.status,
        load: driver.load,
        vehicleAvailable: driver.vehicleAvailable ?? true,
        score: resolveDriverScore?.(showAssignSheet, driver) ?? driver.score,
      }))
      .sort((a, b) => b.score - a.score);
  }, [showAssignSheet, availableDrivers, resolveDriverScore]);

  const currentMissions = activeTab === 'pending' ? pendingMissions : activeTab === 'active' ? activeMissions : urgentMissions;

  const tabCounts = {
    pending: pendingMissions.length,
    active: activeMissions.length,
    urgent: urgentMissions.length,
  };

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface-card/95 backdrop-blur safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className={TYPO.pageTitle}>Dispatch</h1>
            <p className={`${TYPO.sectionSubtitle} text-xs`}>Gestion des missions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDrivers(!showDrivers)}
              className="flex h-9 items-center gap-1 rounded-full bg-green-100 px-3 text-xs font-black text-green-700 dark:bg-green-950/40 dark:text-green-300"
            >
              <Icon name="users" className="h-3.5 w-3.5" />
              {availableDrivers.length}
            </button>
            <MobileButton
              label=""
              icon="arrow-path"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={onRefresh}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* ─── KPIs ─── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.total, tone: 'info' as const },
            { label: 'Urgentes', value: stats.urgent, tone: 'danger' as const },
            { label: 'Attente', value: stats.pending, tone: 'warning' as const },
            { label: 'Actives', value: stats.active, tone: 'success' as const },
          ].map((kpi) => (
            <div key={kpi.label} className={`${CARD.muted} p-2 text-center`}>
              <p className="text-[9px] font-bold text-content-muted">{kpi.label}</p>
              <p className={`mt-0.5 text-lg font-black ${STATUS_COLORS[kpi.tone].text}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: 'pending' as const, label: 'À assigner', icon: 'clock' as const },
            { key: 'active' as const, label: 'En cours', icon: 'truck' as const },
            { key: 'urgent' as const, label: 'Urgences', icon: 'warning' as const },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition ${
                activeTab === tab.key
                  ? 'bg-brand-blue text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                  : 'bg-surface-muted text-content-muted'
              }`}
            >
              <Icon name={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-surface-border'
              }`}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ─── Mission List ─── */}
        <div className="space-y-3">
          {currentMissions.map((mission) => {
            const tone: StatusTone = MISSION_STATUS_MAP[mission.status] || 'neutral';
            const priorityTone = PRIORITY_MAP[mission.priority] || 'neutral';
            const isExpanded = expandedId === mission.id;

            return (
              <div
                key={mission.id}
                className={`${CARD.base} overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-brand-blue' : ''}`}
              >
                {/* Card Header */}
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : mission.id);
                    onSelectMission(mission.id);
                  }}
                  className={`${SPACING.cardPad} w-full text-left`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-content-primary">#{mission.orderRef}</h3>
                        <StatusChip label={mission.priority.toUpperCase()} tone={priorityTone} size="xs" />
                      </div>
                      <p className="mt-0.5 text-xs text-content-muted">{mission.clientName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {mission.queueMinutes > 0 && (
                        <p className="text-xs font-bold text-orange-600">{mission.queueMinutes} min</p>
                      )}
                      <p className="text-[10px] text-content-muted">{mission.pickupZone} → {mission.deliveryZone}</p>
                    </div>
                  </div>
                </button>

                {/* Driver Info */}
                {mission.driverName && (
                  <div className="px-4 pb-2">
                    <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-2 py-1.5 text-xs">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[8px] font-black text-white">
                        {mission.driverName.charAt(0)}
                      </div>
                      <span className="font-bold text-content-primary">{mission.driverName}</span>
                    </div>
                  </div>
                )}

                {/* Quick Actions (always visible) */}
                <div className="px-4 pb-3">
                  <div className="flex gap-2">
                    {mission.status === 'pending' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAssignSheet(mission.id);
                        }}
                        className="flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-xl bg-brand-blue px-3 text-xs font-black text-white transition active:scale-[0.97]"
                      >
                        <Icon name="user" className="h-3 w-3" />
                        Assigner
                      </button>
                    )}
                    {mission.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartMission(mission.id);
                        }}
                        className="flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-xl bg-green-500 px-3 text-xs font-black text-white transition active:scale-[0.97]"
                      >
                        <Icon name="play" className="h-3 w-3" />
                        Démarrer
                      </button>
                    )}
                    {mission.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteMission(mission.id);
                        }}
                        className="flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-xl bg-green-500 px-3 text-xs font-black text-white transition active:scale-[0.97]"
                      >
                        <Icon name="check" className="h-3 w-3" />
                        Terminer
                      </button>
                    )}

                    {/* Secondary actions */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrioritize(mission.id);
                      }}
                      className="flex h-[36px] w-[36px] items-center justify-center rounded-xl border border-orange-200 text-orange-600 transition active:scale-[0.97]"
                      aria-label="Prioriser"
                    >
                      <Icon name="warning" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel(mission.id);
                      }}
                      className="flex h-[36px] w-[36px] items-center justify-center rounded-xl border border-red-200 text-red-600 transition active:scale-[0.97]"
                      aria-label="Annuler"
                    >
                      <Icon name="xmark" className="h-3.5 w-3.5" />
                    </button>
                    {onOpenTracking && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTracking(mission.id);
                        }}
                        className="flex h-[36px] w-[36px] items-center justify-center rounded-xl border border-blue-200 text-brand-blue transition active:scale-[0.97]"
                        aria-label="Ouvrir tracking"
                      >
                        <Icon name="mapPin" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {currentMissions.length === 0 && (
            <div className={`${CARD.base} p-8 text-center`}>
              <Icon name="check" className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm font-bold text-content-muted">
                {activeTab === 'pending' && 'Aucune mission à assigner'}
                {activeTab === 'active' && 'Aucune mission en cours'}
                {activeTab === 'urgent' && 'Aucune urgence en cours'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Drivers Sheet ─── */}
      <BottomSheet
        isOpen={showDrivers}
        onClose={() => setShowDrivers(false)}
        title="Chauffeurs disponibles"
      >
        <div className="space-y-2">
          {availableDrivers.map((driver) => (
            <div key={driver.id} className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-black text-white">
                {driver.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-content-primary">{driver.name}</p>
                <p className="text-xs text-content-muted">{driver.zone} · {driver.load} courses</p>
              </div>
              <StatusChip
                label={`Score ${driver.score}`}
                tone={driver.score >= 70 ? 'success' : 'warning'}
                size="xs"
              />
            </div>
          ))}
          {availableDrivers.length === 0 && (
            <div className="py-8 text-center">
              <Icon name="users" className="mx-auto h-8 w-8 text-content-muted" />
              <p className="mt-2 text-sm font-bold text-content-muted">Aucun chauffeur disponible</p>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ─── Assign Driver Sheet ─── */}
      <DispatcherAssignSheet
        isOpen={!!showAssignSheet}
        missionId={showAssignSheet || ''}
        onClose={() => setShowAssignSheet(null)}
        drivers={assignCandidates}
        onAssign={(driverId) => {
          if (showAssignSheet) {
            onAssignDriver(showAssignSheet, driverId);
            setShowAssignSheet(null);
          }
        }}
        isSaving={isSaving}
      />
    </div>
  );
};

export default DispatcherMobileDashboard;
