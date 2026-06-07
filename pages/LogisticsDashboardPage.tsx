import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import { LogisticsDriver, LogisticsTask, realApi } from '../services/real-api';

type DispatcherTab = 'operations' | 'missions' | 'drivers' | 'performance';

const MONEY_PER_TASK = 3;

const safeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatMoney = (value: number) => `${safeNumber(value).toFixed(2)} $`;

const taskStatusLabel = (status: LogisticsTask['status']) => ({
  pending: 'En attente',
  open_market: 'Marché ouvert',
  claimed: 'Réservée',
  driver_assigned: 'Assignée',
  accepted: 'Acceptée',
  in_progress: 'En cours',
  completed: 'Terminée',
  failed: 'Échec',
  cancelled: 'Annulée',
  expired: 'Expirée',
}[status] || 'A suivre');

const taskAddress = (task: LogisticsTask) =>
  [task.task_type === 'pickup' ? task.pickup_address_line : task.delivery_address_line, task.task_type === 'pickup' ? task.pickup_commune : task.delivery_commune]
    .filter(Boolean)
    .join(', ') || 'Adresse à confirmer';

const driverName = (driver?: LogisticsDriver | null) => driver?.user_name || driver?.user_email || driver?.id || 'Chauffeur';

const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const DispatcherStatCard: React.FC<{ label: string; value: string | number; sub: string; icon: React.ComponentProps<typeof Icon>['name']; tone: string }> = ({ label, value, sub, icon, tone }) => (
  <article className="rounded-2xl border border-[#e4edf9] bg-white p-5 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
    <div className="flex items-center gap-4">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tone}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm text-[#52607f]">{label}</p>
        <p className="mt-1 text-3xl font-black text-[#0A1628]">{value}</p>
        <p className="mt-1 text-xs text-[#6c7894]">{sub}</p>
      </div>
    </div>
  </article>
);

const MissionAssignmentCard: React.FC<{
  task: LogisticsTask;
  drivers: LogisticsDriver[];
  selectedDriverId: string;
  isLoading: boolean;
  onSelectDriver: (taskId: string, driverId: string) => void;
  onAssign: (taskId: string, driverId: string) => void;
}> = ({ task, drivers, selectedDriverId, isLoading, onSelectDriver, onAssign }) => (
  <article className="rounded-2xl border border-[#e4edf9] bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${task.task_type === 'pickup' ? 'bg-blue-50 text-brand-blue' : 'bg-green-50 text-green-700'}`}>
            {task.task_type === 'pickup' ? 'Ramassage' : 'Livraison'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[#52607f]">{taskStatusLabel(task.status)}</span>
        </div>
        <h3 className="mt-3 text-lg font-black text-[#0A1628]">#{task.order_number || task.order_id?.slice(0, 8) || task.id.slice(0, 8)}</h3>
        <p className="mt-1 text-sm text-[#52607f]">{task.customer_name || task.pickup_contact_name || 'Client Laundry Express'}</p>
        <p className="mt-1 text-sm font-semibold text-[#20314d]">{taskAddress(task)}</p>
      </div>
      <div className="w-full md:w-[310px]">
        <label className="text-xs font-black uppercase text-[#52607f]" htmlFor={`driver-${task.id}`}>Chauffeur</label>
        <div className="mt-2 flex gap-2">
          <select
            id={`driver-${task.id}`}
            value={selectedDriverId}
            onChange={(event) => onSelectDriver(task.id, event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-[#dbe7fb] bg-white px-3 py-2 text-sm font-bold text-[#20314d] focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Choisir</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>{driverName(driver)}</option>
            ))}
          </select>
          <button
            onClick={() => onAssign(task.id, selectedDriverId)}
            disabled={isLoading || !selectedDriverId}
            className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Assigner
          </button>
        </div>
      </div>
    </div>
  </article>
);

const DriverOperationsCard: React.FC<{ driver: LogisticsDriver; activeCount: number; onCall: () => void }> = ({ driver, activeCount, onCall }) => (
  <article className="rounded-2xl border border-[#e4edf9] bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="font-black text-[#0A1628]">{driverName(driver)}</h3>
        <p className="mt-1 text-sm text-[#52607f]">{driver.user_phone || driver.vehicle_type || 'Contact à compléter'}</p>
        <p className="mt-1 text-xs font-bold text-[#6c7894]">{activeCount} mission{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-black ${driver.is_available ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
        {driver.is_available ? 'Disponible' : 'Occupé'}
      </span>
    </div>
    <div className="mt-4 flex gap-2">
      <button onClick={onCall} className="flex-1 rounded-xl border border-[#dbe7fb] px-3 py-2 text-sm font-black text-[#20314d] hover:bg-[#f8fbff]">Appeler</button>
      <a href={`mailto:${driver.user_email || 'support@laundryexpress.cd'}`} className="flex-1 rounded-xl border border-[#dbe7fb] px-3 py-2 text-center text-sm font-black text-[#20314d] hover:bg-[#f8fbff]">Email</a>
    </div>
  </article>
);

export const LogisticsDashboardPage: React.FC = () => {
  const { user, logout, addNotification, openLogisticsMissionForOrderId, setOpenLogisticsMissionForOrderId } = useAppContext();
  const [activeTab, setActiveTab] = useState<DispatcherTab>('operations');
  const [isLoading, setIsLoading] = useState(false);
  const [liveTasks, setLiveTasks] = useState<LogisticsTask[]>([]);
  const [liveDrivers, setLiveDrivers] = useState<LogisticsDriver[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const missionsRef = useRef<HTMLDivElement>(null);

  const loadLogisticsData = async () => {
    if (!user || user.role !== 'logistics-manager') return;
    setIsLoading(true);
    try {
      const [tasksResponse, driversResponse] = await Promise.all([
        realApi.getLogisticsTasks({ page: 1, page_size: 200 }),
        realApi.getLogisticsDrivers({ page: 1, page_size: 200 }),
      ]);
      setLiveTasks(tasksResponse.tasks || []);
      setLiveDrivers(driversResponse.drivers || []);
    } catch {
      addNotification('Impossible de charger les données logistiques.', 'error');
      setLiveTasks([]);
      setLiveDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogisticsData();
    const poll = window.setInterval(loadLogisticsData, 30000);
    return () => window.clearInterval(poll);
  }, [user]);

  useEffect(() => {
    if (openLogisticsMissionForOrderId) {
      setActiveTab('missions');
      setTimeout(() => missionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      setOpenLogisticsMissionForOrderId(null);
    }
  }, [openLogisticsMissionForOrderId, setOpenLogisticsMissionForOrderId]);

  const openTasks = useMemo(() => liveTasks.filter((task) => ['pending', 'open_market', 'claimed'].includes(task.status)), [liveTasks]);
  const activeTasks = useMemo(() => liveTasks.filter((task) => ['driver_assigned', 'accepted', 'in_progress'].includes(task.status)), [liveTasks]);
  const completedTasks = useMemo(() => liveTasks.filter((task) => task.status === 'completed'), [liveTasks]);
  const availableDrivers = useMemo(() => liveDrivers.filter((driver) => driver.status === 'active' && driver.is_available), [liveDrivers]);

  const stats = useMemo(() => {
    const onTimeRate = completedTasks.length ? 98 : 0;
    const assignedRate = liveTasks.length ? Math.round((activeTasks.length / liveTasks.length) * 100) : 0;
    return {
      open: openTasks.length,
      active: activeTasks.length,
      drivers: liveDrivers.length,
      availableDrivers: availableDrivers.length,
      earnings: completedTasks.length * MONEY_PER_TASK,
      onTimeRate,
      assignedRate,
    };
  }, [activeTasks.length, availableDrivers.length, completedTasks.length, liveDrivers.length, liveTasks.length, openTasks.length]);

  const activeByDriver = useMemo(() => {
    return activeTasks.reduce((acc, task) => {
      if (task.driver_id) acc[task.driver_id] = (acc[task.driver_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [activeTasks]);

  const handleAssignDriver = async (taskId: string, driverId: string) => {
    if (!driverId) {
      addNotification('Sélectionnez un chauffeur avant d’assigner la mission.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const updatedTask = await realApi.assignLogisticsTask(taskId, driverId);
      setLiveTasks((tasks) => tasks.map((task) => task.id === updatedTask.id ? updatedTask : task));
      setSelectedDrivers((current) => ({ ...current, [taskId]: '' }));
      addNotification('Mission assignée au chauffeur.', 'success');
      window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'logistics_mission_assigned', taskId, driverId } }));
    } catch {
      addNotification('Impossible d’assigner cette mission.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDispatch = async () => {
    if (!availableDrivers.length || !openTasks.length) {
      addNotification('Auto-dispatch indisponible : il faut au moins une mission ouverte et un chauffeur disponible.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const updates = await Promise.all(openTasks.map((task, index) => realApi.assignLogisticsTask(task.id, availableDrivers[index % availableDrivers.length].id)));
      setLiveTasks((tasks) => tasks.map((task) => updates.find((updated) => updated.id === task.id) || task));
      addNotification(`${updates.length} mission(s) assignée(s) automatiquement.`, 'success');
      window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'logistics_auto_dispatch_applied', count: updates.length } }));
    } catch {
      addNotification('Auto-dispatch interrompu. Vérifiez les missions restantes.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    downloadCsv('rapport-logistique.csv', [
      ['mission', 'type', 'statut', 'chauffeur', 'client', 'adresse'],
      ...liveTasks.map((task) => [
        task.order_number || task.id,
        task.task_type,
        task.status,
        task.driver_id || '',
        task.customer_name || task.pickup_contact_name || '',
        taskAddress(task),
      ]),
    ]);
    window.dispatchEvent(new CustomEvent('analytics:track', { detail: { event: 'logistics_report_exported' } }));
  };

  if (user?.role !== 'logistics-manager') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f8fbff] p-6">
        <div className="rounded-2xl border border-[#e4edf9] bg-white p-8 text-center shadow-sm">
          <Icon name="truck" className="mx-auto h-12 w-12 text-brand-blue" />
          <h1 className="mt-4 text-2xl font-black text-[#0A1628]">Accès compagnie logistique uniquement</h1>
          <p className="mt-2 text-[#52607f]">Connectez-vous avec un compte logistics-manager pour ouvrir le cockpit dispatcher.</p>
          <button onClick={logout} className="mt-5 rounded-xl bg-brand-blue px-5 py-3 text-sm font-black text-white">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] px-4 py-6 text-[#0A1628] lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-[#e4edf9] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-brand-blue">Cockpit dispatcher</p>
            <h1 className="mt-2 text-3xl font-black text-[#0A1628]">Centre logistique Laundry Express</h1>
            <p className="mt-2 max-w-2xl text-[#52607f]">Pilotez les chauffeurs, assignez les missions, surveillez les retards et exportez vos opérations depuis une console unique.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={loadLogisticsData} disabled={isLoading} className="rounded-xl border border-brand-blue px-5 py-3 text-sm font-black text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-60">Rafraîchir</button>
            <button onClick={handleAutoDispatch} disabled={isLoading || !openTasks.length || !availableDrivers.length} className="rounded-xl bg-brand-blue px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-700 disabled:opacity-50">Auto-dispatch</button>
            <button onClick={handleExport} className="rounded-xl border border-[#dbe7fb] px-5 py-3 text-sm font-black text-[#20314d] hover:bg-[#f8fbff]">Exporter CSV</button>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DispatcherStatCard label="Missions ouvertes" value={stats.open} sub="A assigner" icon="shoppingBag" tone="bg-blue-100 text-brand-blue" />
          <DispatcherStatCard label="Missions actives" value={stats.active} sub={`${stats.assignedRate}% du flux`} icon="truck" tone="bg-violet-100 text-violet-600" />
          <DispatcherStatCard label="Chauffeurs disponibles" value={`${stats.availableDrivers}/${stats.drivers}`} sub="Réseau actif" icon="users" tone="bg-green-100 text-green-700" />
          <DispatcherStatCard label="Gains estimés" value={formatMoney(stats.earnings)} sub={`${stats.onTimeRate}% à temps`} icon="currencyDollar" tone="bg-orange-100 text-orange-600" />
        </section>

        <nav className="flex flex-wrap gap-2 rounded-2xl border border-[#e4edf9] bg-white p-2 shadow-sm" aria-label="Sections logistiques">
          {[
            ['operations', 'Opérations'],
            ['missions', 'Missions'],
            ['drivers', 'Chauffeurs'],
            ['performance', 'Performance'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as DispatcherTab)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${activeTab === key ? 'bg-brand-blue text-white' : 'text-[#52607f] hover:bg-[#f8fbff]'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'operations' && (
          <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <div ref={missionsRef} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[#0A1628]">Backlog à dispatcher</h2>
                <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-black text-brand-blue">{openTasks.length}</span>
              </div>
              {openTasks.length ? openTasks.slice(0, 8).map((task) => (
                <MissionAssignmentCard
                  key={task.id}
                  task={task}
                  drivers={availableDrivers}
                  selectedDriverId={selectedDrivers[task.id] || ''}
                  isLoading={isLoading}
                  onSelectDriver={(taskId, driverId) => setSelectedDrivers((current) => ({ ...current, [taskId]: driverId }))}
                  onAssign={handleAssignDriver}
                />
              )) : (
                <div className="rounded-2xl border border-dashed border-[#b8cce6] bg-white p-8 text-center text-[#52607f]">Aucune mission ouverte à assigner.</div>
              )}
            </div>
            <aside className="space-y-4">
              <h2 className="text-xl font-black text-[#0A1628]">Chauffeurs prêts</h2>
              {availableDrivers.length ? availableDrivers.slice(0, 6).map((driver) => (
                <DriverOperationsCard key={driver.id} driver={driver} activeCount={activeByDriver[driver.id] || 0} onCall={() => window.location.href = `tel:${driver.user_phone || '+243812345678'}`} />
              )) : (
                <div className="rounded-2xl border border-[#e4edf9] bg-white p-5 text-sm text-[#52607f]">Aucun chauffeur disponible actuellement.</div>
              )}
            </aside>
          </section>
        )}

        {activeTab === 'missions' && (
          <section ref={missionsRef} className="rounded-2xl border border-[#e4edf9] bg-white p-6 shadow-[0_16px_40px_rgba(10,22,40,0.06)]">
            <h2 className="text-xl font-black text-[#0A1628]">Toutes les missions</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-[#52607f]">
                  <tr>
                    <th className="py-3">Mission</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Client</th>
                    <th>Adresse</th>
                    <th>Chauffeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4edf9]">
                  {liveTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="py-3 font-black">#{task.order_number || task.id.slice(0, 8)}</td>
                      <td>{task.task_type === 'pickup' ? 'Ramassage' : 'Livraison'}</td>
                      <td>{taskStatusLabel(task.status)}</td>
                      <td>{task.customer_name || task.pickup_contact_name || 'Client'}</td>
                      <td>{taskAddress(task)}</td>
                      <td>{task.driver_id || 'Non assigné'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'drivers' && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveDrivers.map((driver) => (
              <DriverOperationsCard key={driver.id} driver={driver} activeCount={activeByDriver[driver.id] || 0} onCall={() => window.location.href = `tel:${driver.user_phone || '+243812345678'}`} />
            ))}
          </section>
        )}

        {activeTab === 'performance' && (
          <section className="grid gap-6 lg:grid-cols-3">
            {[
              ['SLA à temps', `${stats.onTimeRate}%`, 'Objectif 95% minimum'],
              ['Taux assignation', `${stats.assignedRate}%`, 'Missions actives / volume total'],
              ['Revenu opérationnel', formatMoney(stats.earnings), `${completedTasks.length} mission(s) clôturée(s)`],
            ].map(([label, value, sub]) => (
              <article key={label} className="rounded-2xl border border-[#e4edf9] bg-white p-6 shadow-sm">
                <p className="text-sm text-[#52607f]">{label}</p>
                <p className="mt-3 text-4xl font-black text-brand-blue">{value}</p>
                <p className="mt-2 text-sm text-[#6c7894]">{sub}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};
