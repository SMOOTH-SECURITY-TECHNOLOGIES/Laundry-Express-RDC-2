import React from 'react';
import { Icon } from '../../../components/Icon';
import { OperationalAlertsPanel } from './OperationalAlertsPanel';
import { DispatcherDecisionPanel } from './DispatcherDecisionPanel';
import type { OperationalAlerts, OperationalModel, NavigateHandler, OperationalTowerMode } from './useOperationalDashboard';
import { filterPriorityMissions, statusIn } from './operational-utils';
import type { LogisticsTask } from '../../../services/real-api';

export const ControlTowerPanel: React.FC<{
  model: OperationalModel;
  driversTotal: number;
  alerts: OperationalAlerts;
  mode: OperationalTowerMode;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onNavigate?: NavigateHandler;
}> = ({ model, driversTotal, alerts, mode, searchQuery, onSearchChange, onRefresh, onNavigate }) => {
  const maxActivity = Math.max(1, ...model.fieldActivity.map((item) => item.count));
  const filteredPriority = filterPriorityMissions(model.priorityMissions, searchQuery);

  return (
    <section className="overflow-hidden rounded-[28px] bg-[#0b0f16] p-4 text-white shadow-2xl shadow-black/20 sm:p-5 lg:p-6">
      <div className="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]">
        <aside className="hidden rounded-[24px] border border-white/10 bg-white/[0.03] px-3 py-4 xl:flex xl:flex-col xl:items-center xl:justify-between">
          <div className="space-y-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue text-white">
              <Icon name="truck" className="h-5 w-5" />
            </span>
            {(['dashboard', 'dispatch', 'tracking', 'drivers', 'maintenance'] as const).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => onNavigate?.(section)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/60 hover:bg-white/10 hover:text-white"
                aria-label={section}
              >
                <Icon
                  name={
                    section === 'dashboard'
                      ? 'home'
                      : section === 'dispatch'
                        ? 'shoppingBag'
                        : section === 'tracking'
                          ? 'map'
                          : section === 'drivers'
                            ? 'users'
                            : 'settings'
                  }
                  className="h-4 w-4"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Actualiser"
          >
            <Icon name="arrow-path" className="h-4 w-4" />
          </button>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
            <label className="relative">
              <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher mission, chauffeur, zone, plaque..."
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-blue"
              />
            </label>
            <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-sm font-black">Control Tower</p>
              <p className="text-xs text-white/45">{mode === 'backend' ? 'Connecté · pilotage live' : 'Mode lecture seule'}</p>
            </div>
          </div>

          <DispatcherDecisionPanel
            decisions={model.decisions}
            capacitySummary={model.capacitySummary}
            onNavigate={onNavigate}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['On Time Delivery', `${model.onTimeRate}%`, model.completedTasks.length === 0 ? 'En attente de clôtures' : 'Ponctualité opérationnelle'],
              ['Missions ouvertes', String(model.openTasks.length), model.openTasks.length === 0 ? 'File d’attente vide' : 'À traiter maintenant'],
              ['Chauffeurs actifs', `${model.activeDrivers.length}/${driversTotal}`, `${model.availableDrivers.length} disponible(s)`],
              ['Driver Score', `${model.behaviorScore}%`, 'Score réseau'],
            ].map(([label, value, detail], index) => (
              <article
                key={label}
                className={`rounded-[22px] border border-white/10 p-5 ${index === 0 ? 'bg-brand-blue text-white' : 'bg-white/[0.05]'}`}
              >
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
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-white/55">
                  Aucune activité terrain sur la période sélectionnée.
                </div>
              ) : (
                <div className="mt-6 flex h-56 items-end gap-2 rounded-[20px] bg-black/20 px-3 pb-3 pt-6">
                  {model.fieldActivity.map((bar) => (
                    <div key={bar.hour} className="flex h-full flex-1 flex-col justify-end gap-2">
                      <div
                        className={`rounded-t-xl ${bar.count >= 20 ? 'bg-green-400' : bar.count >= 10 ? 'bg-blue-400' : 'bg-white/40'}`}
                        style={{ height: `${Math.max(10, (bar.count / maxActivity) * 100)}%` }}
                      />
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
                  <p className="rounded-2xl bg-black/20 p-5 text-sm text-white/55">Aucune mission prioritaire — file d’attente stable.</p>
                ) : (
                  filteredPriority.map((mission: LogisticsTask) => (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => onNavigate?.('dispatch', { missionId: mission.id })}
                      className="grid w-full grid-cols-[88px_minmax(0,1fr)_88px] items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm hover:bg-white/10"
                    >
                      <span className="font-mono font-black">{mission.order_number || mission.id}</span>
                      <span className="truncate text-white/65">
                        {mission.pickup_address_line || mission.pickup_commune || 'Adresse à confirmer'}
                      </span>
                      <span
                        className={`justify-self-end rounded-full px-2 py-1 text-[11px] font-black ${
                          mission.status === 'completed'
                            ? 'bg-green-400 text-slate-950'
                            : statusIn(mission.status, ['failed', 'expired'])
                              ? 'bg-red-400 text-white'
                              : 'bg-blue-400 text-slate-950'
                        }`}
                      >
                        {mission.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <OperationalAlertsPanel
              alerts={alerts}
              exceptions={model.operationalExceptions}
              onNavigate={onNavigate}
              variant="tower"
            />

            <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-lg font-black">Top zones</h2>
              <div className="mt-4 space-y-3">
                {model.topZones.length === 0 ? (
                  <p className="text-sm text-white/55">Aucune zone calculable.</p>
                ) : (
                  model.topZones.map((zone) => (
                    <button
                      key={zone.zone}
                      type="button"
                      onClick={() => onNavigate?.('dispatch', { zone: zone.zone })}
                      className="grid w-full grid-cols-[1fr_64px_64px] items-center gap-3 rounded-2xl bg-black/20 px-3 py-3 text-left"
                    >
                      <span className="font-bold">{zone.zone}</span>
                      <span className="text-xs text-white/55">{zone.missions} miss.</span>
                      <span
                        className={`rounded-full px-2 py-1 text-center text-xs font-black ${
                          zone.success >= 90 ? 'bg-green-400 text-slate-950' : zone.success >= 70 ? 'bg-orange-400 text-slate-950' : 'bg-red-400 text-white'
                        }`}
                      >
                        {zone.success}%
                      </span>
                    </button>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-lg font-black">Top chauffeurs</h2>
              <div className="mt-4 space-y-3">
                {model.readyDrivers.length === 0 ? (
                  <p className="rounded-2xl bg-black/20 p-4 text-sm text-white/55">
                    Aucune donnée chauffeur suffisante pour établir un classement fiable.
                  </p>
                ) : (
                  model.readyDrivers.slice(0, 5).map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => onNavigate?.('drivers', { driverName: driver.name })}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-black/20 p-3 text-left hover:bg-white/10"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{driver.name}</span>
                        <span className="text-xs text-white/50">
                          {driver.vehicle} · {driver.zone}
                        </span>
                      </span>
                      <span className="text-sm font-black text-green-300">{driver.score}%</span>
                    </button>
                  ))
                )}
              </div>
            </article>
          </div>

          <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black">État flotte & maintenance</h2>
                <p className="text-xs text-white/50">Disponibilité véhicules, blocages maintenance et capacité terrain.</p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                  model.fleet.blockingMaintenance > 0 || model.fleet.outOfService > 0
                    ? 'bg-orange-400 text-slate-950'
                    : model.fleet.total === 0
                      ? 'bg-white/15 text-white/70'
                      : 'bg-green-400 text-slate-950'
                }`}
              >
                {model.fleet.total === 0 ? 'À connecter' : `${model.fleet.readinessRate}% prêt`}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Total', model.fleet.total],
                ['Disponibles', model.fleet.available],
                ['En mission', model.fleet.inMission],
                ['Maintenance', model.fleet.maintenance],
                ['Hors service', model.fleet.outOfService],
              ].map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onNavigate?.(label === 'Maintenance' || label === 'Hors service' ? 'maintenance' : 'fleet')}
                  className="rounded-2xl bg-black/20 p-4 text-left hover:bg-white/10"
                >
                  <span className="block text-xs font-bold text-white/55">{label}</span>
                  <span className="mt-2 block text-2xl font-black">{value}</span>
                </button>
              ))}
            </div>

            {(model.fleet.blockingMaintenance > 0 || model.fleet.overdueMaintenance > 0) && (
              <button
                type="button"
                onClick={() => onNavigate?.('maintenance')}
                className="mt-4 w-full rounded-2xl border border-orange-300/40 bg-orange-400/10 px-4 py-3 text-left text-sm font-bold text-orange-100 hover:bg-orange-400/20"
              >
                {model.fleet.blockingMaintenance} véhicule(s) bloqué(s), {model.fleet.overdueMaintenance} maintenance(s) overdue.
                Ouvrir Maintenance pour lever le blocage d’assignation.
              </button>
            )}
          </article>
        </div>
      </div>
    </section>
  );
};
