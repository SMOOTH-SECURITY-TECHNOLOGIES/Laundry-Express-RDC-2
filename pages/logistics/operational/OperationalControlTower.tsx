import React, { useState } from 'react';
import type { LogisticsDriver, LogisticsTask } from '../../../services/real-api';
import type { DataMode } from '../../../services/logistics-api';
import type { useRealTimeAlerts } from '../../../hooks/useRealTimeAlerts';
import { PERIOD_OPTIONS, type PeriodKey } from './operational-utils';
import { useOperationalDashboard } from './useOperationalDashboard';
import { OperationalSkeleton } from './OperationalSkeleton';
import { OperationalNetworkStrip } from './OperationalNetworkStrip';
import { CapabilityMatrixPanel } from './CapabilityMatrixPanel';
import { GpsMonitoringPanel } from './GpsMonitoringPanel';
import { DriverBehaviorPanel } from './DriverBehaviorPanel';
import { VehicleHealthPanel } from './VehicleHealthPanel';
import { FuelControlPanel } from './FuelControlPanel';
import { StockSuppliesPanel } from './StockSuppliesPanel';
import { ControlTowerPanel } from './ControlTowerPanel';
import { TruthCorridorPipeline } from './TruthCorridorPipeline';
import { TruthHealthCards } from './TruthHealthCards';
import { ActivityFeedPanel } from './ActivityFeedPanel';
import { QuickActionsPanel } from './QuickActionsPanel';
import { DispatchBacklogPanel } from './DispatchBacklogPanel';
import { DispatchMapPanel } from './DispatchMapPanel';

export type OperationalNavigateHandler = (
  section: string,
  options?: { missionId?: string; driverName?: string; zone?: string },
) => void;

export const OperationalControlTower: React.FC<{
  tasks: LogisticsTask[];
  drivers: LogisticsDriver[];
  alerts: ReturnType<typeof useRealTimeAlerts>['alerts'];
  mode: DataMode;
  isLoading: boolean;
  lastSync: Date | null;
  includeAdminInsights?: boolean;
  onRefresh: () => void;
  onNavigate?: OperationalNavigateHandler;
}> = ({ tasks, drivers, alerts, mode, isLoading, lastSync, includeAdminInsights = false, onRefresh, onNavigate }) => {
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const { model, activity, loadingSources, syncStatus, driverPositions, loadSources } = useOperationalDashboard(
    tasks,
    drivers,
    period,
    includeAdminInsights,
  );

  if (isLoading || loadingSources) return <OperationalSkeleton />;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="rounded-[24px] border border-surface-border-subtle bg-surface-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black uppercase text-content-primary sm:text-3xl">Centre opérationnel</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${mode === 'backend' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}
              >
                {mode === 'backend' ? 'LIVE' : 'READ-ONLY'}
              </span>
            </div>
            <p className="mt-1 text-sm text-content-muted">Pilotage temps réel — que faire maintenant, où est le problème</p>
            <p className="mt-2 text-xs font-semibold text-green-700">{syncStatus.label}</p>
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
              Synchro:{' '}
              {lastSync ? lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}
            </span>
          </div>
        </div>
      </section>

      <OperationalNetworkStrip model={model} syncStatus={syncStatus} />

      <CapabilityMatrixPanel capabilities={model.capabilities} />

      <section className="grid gap-4 xl:grid-cols-2">
        <GpsMonitoringPanel gpsHealth={model.gpsHealth} />
        <DriverBehaviorPanel behavior={model.driverBehavior} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <VehicleHealthPanel health={model.vehicleHealth} onNavigate={onNavigate} />
        <FuelControlPanel fuel={model.fuelControl} onNavigate={onNavigate} />
      </section>

      <StockSuppliesPanel stock={model.stockControl} onNavigate={onNavigate} />

      <ControlTowerPanel
        model={model}
        driversTotal={drivers.length}
        alerts={alerts}
        mode={mode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={onRefresh}
        onNavigate={onNavigate}
      />

      <TruthCorridorPipeline model={model} />

      <section className="grid gap-4 xl:grid-cols-2">
        <TruthHealthCards model={model} />
        <ActivityFeedPanel events={activity} signals={model.activitySignals} />
      </section>

      <QuickActionsPanel onNavigate={onNavigate} />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DispatchBacklogPanel missions={model.backlogItems} onNavigate={onNavigate} />
        <DispatchMapPanel model={model} driverPositions={driverPositions} onNavigate={onNavigate} />
      </section>
    </div>
  );
};
