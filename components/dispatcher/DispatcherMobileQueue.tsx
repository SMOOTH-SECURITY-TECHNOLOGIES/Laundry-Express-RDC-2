import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { HorizontalFilter, type FilterOption } from '../ui/HorizontalFilter';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';

type TaskStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'delayed' | 'failed' | 'cancelled';
type TaskPriority = 'normal' | 'high' | 'urgent';
type MobileFilter = 'all' | 'urgent' | 'pending' | 'assigned' | 'in_transit';

interface DispatchTask {
  id: string;
  orderId: string;
  shipmentId: string;
  status: TaskStatus;
  customerName: string;
  pickupAddress: string;
  pickupZone: string;
  deliveryZone: string;
  distanceKm: number;
  queueMinutes: number;
  priority: TaskPriority;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  currentDriverLoad?: number;
}

interface DriverCandidate {
  id: string;
  name: string;
  zone: string;
  status: 'available' | 'busy';
  score: number;
  load: number;
  vehicleAvailable: boolean;
}

interface DispatcherMobileQueueProps {
  tasks: DispatchTask[];
  drivers: DriverCandidate[];
  onSelectTask: (id: string) => void;
  onAssign: (taskId: string, driverId: string) => void;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onPrioritize: (taskId: string) => void;
  onCancel: (taskId: string) => void;
  onOpenTracking: (task: DispatchTask) => void;
  isSaving: boolean;
}

const PRIORITY_MAP: Record<TaskPriority, StatusTone> = {
  urgent: 'danger',
  high: 'warning',
  normal: 'info',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Nouvelle',
  assigned: 'Assignée',
  in_transit: 'En cours',
  delivered: 'Terminée',
  delayed: 'Retard',
  failed: 'Échec',
  cancelled: 'Annulée',
};

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'urgent', label: 'Urgentes' },
  { key: 'pending', label: 'Nouvelles' },
  { key: 'assigned', label: 'Assignées' },
  { key: 'in_transit', label: 'En cours' },
];

export const DispatcherMobileQueue: React.FC<DispatcherMobileQueueProps> = ({
  tasks,
  drivers,
  onSelectTask,
  onAssign,
  onStart,
  onComplete,
  onPrioritize,
  onCancel,
  onOpenTracking,
  isSaving,
}) => {
  const [activeFilter, setActiveFilter] = useState<MobileFilter>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showDriverList, setShowDriverList] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (activeFilter === 'all') return task.status !== 'delivered' && task.status !== 'cancelled';
      if (activeFilter === 'urgent') return task.priority === 'urgent' || task.queueMinutes >= 15;
      return task.status === activeFilter;
    });
    return [...filtered].sort((a, b) => {
      const priorityScore: Record<TaskPriority, number> = { urgent: 3, high: 2, normal: 1 };
      return priorityScore[b.priority] - priorityScore[a.priority] || b.queueMinutes - a.queueMinutes;
    });
  }, [activeFilter, tasks]);

  const filterCounts: Record<MobileFilter, number> = {
    all: tasks.filter((t) => t.status !== 'delivered' && t.status !== 'cancelled').length,
    urgent: tasks.filter((t) => t.priority === 'urgent' || t.queueMinutes >= 15).length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    assigned: tasks.filter((t) => t.status === 'assigned').length,
    in_transit: tasks.filter((t) => t.status === 'in_transit').length,
  };

  const rankedDrivers = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return [];
    return drivers
      .map((d) => ({ driver: d, score: d.vehicleAvailable ? Math.max(0, 100 - d.load * 10 - (d.zone === task.pickupZone ? 0 : 30)) : -1 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={TYPO.sectionTitle}>File dispatch</h2>
        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-brand-blue/10 px-2 text-[10px] font-black text-brand-blue">
          {filteredTasks.length}
        </span>
      </div>

      {/* Filters */}
      <HorizontalFilter
        options={FILTER_OPTIONS.map((opt) => ({
          ...opt,
          count: filterCounts[opt.key as MobileFilter],
        }))}
        activeKey={activeFilter}
        onChange={(key) => setActiveFilter(key as MobileFilter)}
      />

      {/* Task Cards */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const tone: StatusTone = MISSION_STATUS_MAP[task.status] || 'neutral';
          const priorityTone = PRIORITY_MAP[task.priority];
          const isExpanded = expandedTaskId === task.id;
          const showDrivers = showDriverList === task.id;

          return (
            <div
              key={task.id}
              className={`${CARD.base} overflow-hidden transition-all ${
                isExpanded ? 'ring-2 ring-brand-blue' : ''
              }`}
            >
              {/* Card Header */}
              <button
                type="button"
                onClick={() => {
                  setExpandedTaskId(isExpanded ? null : task.id);
                  onSelectTask(task.id);
                }}
                className={`${SPACING.cardPad} w-full text-left`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={TYPO.label}>{STATUS_LABELS[task.status]}</p>
                    <h3 className={`mt-0.5 ${TYPO.pageTitle} text-lg`}>{task.id}</h3>
                    <p className={`mt-0.5 ${TYPO.sectionSubtitle}`}>{task.customerName}</p>
                  </div>
                  <StatusChip label={task.priority.toUpperCase()} tone={priorityTone} size="xs" />
                </div>

                {/* Route */}
                <div className={`${CARD.muted} mt-3 p-3 space-y-1`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">Pickup</span>
                    <span className="font-black text-content-primary">{task.pickupZone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">Destination</span>
                    <span className="font-black text-content-primary">{task.deliveryZone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-muted">Attente</span>
                    <span className="font-black text-content-primary">{task.queueMinutes} min · {task.distanceKm} km</span>
                  </div>
                </div>
              </button>

              {/* Driver Info */}
              {task.driverName && (
                <div className={`${SPACING.cardPad} pt-0`}>
                  <div className="rounded-xl bg-surface-muted px-3 py-2 text-sm">
                    <span className="font-black text-content-primary">Chauffeur: {task.driverName}</span>
                    <span className="text-content-muted"> · charge {task.currentDriverLoad ?? 0}</span>
                  </div>
                </div>
              )}

              {/* Actions (expanded) */}
              {isExpanded && (
                <div className={`${SPACING.cardPad} pt-0 space-y-2`}>
                  {task.status === 'pending' && (
                    <MobileButton
                      label="Assigner un chauffeur"
                      icon="user"
                      variant="primary"
                      size="md"
                      loading={isSaving}
                      onClick={() => setShowDriverList(showDrivers ? null : task.id)}
                    />
                  )}

                  {task.status === 'assigned' && (
                    <div className="grid grid-cols-2 gap-2">
                      <MobileButton
                        label="Démarrer"
                        icon="play"
                        variant="success"
                        size="sm"
                        onClick={() => onStart(task.id)}
                      />
                      <MobileButton
                        label="Réassigner"
                        icon="arrow-path"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDriverList(showDrivers ? null : task.id)}
                      />
                    </div>
                  )}

                  {task.status === 'in_transit' && (
                    <MobileButton
                      label="Terminer"
                      icon="check"
                      variant="success"
                      size="md"
                      onClick={() => onComplete(task.id)}
                    />
                  )}

                  {task.status !== 'delivered' && task.status !== 'cancelled' && (
                    <div className="grid grid-cols-2 gap-2">
                      <MobileButton
                        label="Prioriser"
                        icon="warning"
                        variant="warning"
                        size="sm"
                        onClick={() => onPrioritize(task.id)}
                      />
                      <MobileButton
                        label="Tracking"
                        icon="mapPin"
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenTracking(task)}
                      />
                    </div>
                  )}

                  {task.status !== 'delivered' && task.status !== 'cancelled' && (
                    <MobileButton
                      label="Annuler"
                      icon="xmark"
                      variant="danger"
                      size="sm"
                      onClick={() => onCancel(task.id)}
                    />
                  )}

                  {/* Driver Matching List */}
                  {showDrivers && (
                    <div className={`${CARD.muted} p-3 space-y-2`}>
                      <p className={TYPO.label}>Chauffeurs recommandés</p>
                      {rankedDrivers(task.id).map(({ driver, score }) => (
                        <button
                          key={driver.id}
                          type="button"
                          disabled={score < 0}
                          onClick={() => {
                            if (score >= 0) {
                              onAssign(task.id, driver.id);
                              setShowDriverList(null);
                            }
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                            score < 0
                              ? 'cursor-not-allowed opacity-50 bg-surface-muted'
                              : 'bg-surface-card hover:bg-surface-page active:scale-[0.98]'
                          }`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
                            driver.status === 'available' ? 'bg-green-500' : 'bg-orange-500'
                          }`}>
                            {driver.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-content-primary">{driver.name}</p>
                            <p className="text-[10px] text-content-muted">{driver.zone} · {driver.load} courses</p>
                          </div>
                          <StatusChip
                            label={score < 0 ? 'Bloqué' : String(score)}
                            tone={score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger'}
                            size="sm"
                            variant="filled"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className={`${CARD.base} p-8 text-center`}>
            <Icon name="check" className="mx-auto h-8 w-8 text-green-500" />
            <p className="mt-2 text-sm font-bold text-content-muted">Aucune mission dans ce filtre</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherMobileQueue;
