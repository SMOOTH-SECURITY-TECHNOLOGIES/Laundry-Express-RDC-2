import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import {
  Partner,
  PartnerDeliveryActivityEntry,
  PartnerDeliveryDriver,
  PartnerDeliveryRow,
  PartnerDeliveryUrgentAction,
  PartnerSection,
} from '../../types';
import { DB } from '../../constants';
import { findPartner } from '../../utils/findPartner';
import {
  InterventionActionModal,
  InterventionContext,
  InterventionResult,
} from './delivery/InterventionActionModal';
import { DriverManagementModal } from './delivery/DriverManagementModal';
import { partnerCtaLight } from './partner-ui';
import { NewDeliveryFormValues, NewDeliveryModal } from './delivery/NewDeliveryModal';

interface DeliveryProps { setSection?: (section: PartnerSection) => void; }

type DeliveryRow = PartnerDeliveryRow;
type UrgentActionType = PartnerDeliveryUrgentAction;

interface UrgentInterventionView {
  deliveryId: string;
  issue: string;
  actionLabel: string;
  actionType: UrgentActionType;
  client: string;
  driver: string;
}

const COMMUNES = ['Gombe', 'Ngaliema', 'Limete', 'Kintambo', 'Bandalungwa'];

const DEFAULT_DRIVERS: PartnerDeliveryDriver[] = [
  { id: 'drv-1', name: 'Jean L.', phone: '+243 84 567 89 01', state: 'Actif', zones: ['Gombe', 'Ngaliema'], total: 1250, avgTime: '32 min', rating: 4.9, success: 99, remaining: '1h45' },
  { id: 'drv-2', name: 'David K.', phone: '+243 85 678 90 12', state: 'Actif', zones: ['Limete', 'Kintambo'], total: 890, avgTime: '38 min', rating: 4.7, success: 97, remaining: '45min' },
  { id: 'drv-3', name: 'Marie T.', phone: '+243 86 789 01 23', state: 'Actif', zones: ['Gombe', 'Limete'], total: 560, avgTime: '42 min', rating: 4.8, success: 98, remaining: '30min' },
  { id: 'drv-4', name: 'Paul M.', phone: '+243 87 890 12 34', state: 'Inactif', zones: ['Bandalungwa'], total: 2100, avgTime: '28 min', rating: 4.9, success: 99, remaining: '0' },
];

const driverNames = (drivers: PartnerDeliveryDriver[]) => drivers.map((d) => d.name);

const URGENT_ACTION_LABELS: Record<UrgentActionType, string> = {
  contact: 'Contacter',
  reassign: 'Reassigner',
  escalate: 'Escalader',
};

const createInitialDeliveries = (names: string[] = driverNames(DEFAULT_DRIVERS)): DeliveryRow[] => {
  const statuses = ['En livraison', 'Livre', 'En attente', 'Echec', 'En route', 'Livre', 'Livre', 'Livre'] as const;
  const clients = ['Patrick M.', 'Sarah K.', 'Alain T.', 'Marie L.', 'Entreprise ABC'];
  const drivers = names.length ? names : driverNames(DEFAULT_DRIVERS);
  const urgentByIndex: Record<number, { issue: string; action: UrgentActionType }> = {
    2: { issue: 'Client absent', action: 'contact' },
    3: { issue: 'Retard > 30 min', action: 'reassign' },
    4: { issue: 'Adresse incomplete', action: 'escalate' },
  };

  return Array.from({ length: 20 }, (_, i) => {
    const urgent = urgentByIndex[i];
    return {
      id: `DEL-2026-${String(i + 1).padStart(3, '0')}`,
      orderNumber: `ORDER-20${48 - i}`,
      client: clients[i % 5],
      commune: COMMUNES[i % COMMUNES.length],
      driver: drivers[i % drivers.length],
      amount: 12 + Math.floor(Math.random() * 35),
      status: urgent ? (i === 3 ? 'En livraison' : i === 4 ? 'Echec' : 'En route') : (statuses[i % 8] as string),
      time: `${9 + (i % 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      date: new Date(Date.now() - i * 3600000 * 4).toLocaleDateString('fr-FR'),
      urgentIssue: urgent?.issue,
      urgentAction: urgent?.action,
      urgentResolved: false,
    };
  });
};

const DEFAULT_ACTIVITY_LOG: PartnerDeliveryActivityEntry[] = [
  { time: '10:25', icon: 'shoppingBag', color: 'text-brand-blue', title: 'Commande DEL-001 creee', detail: 'Patrick M. — Gombe' },
  { time: '10:32', icon: 'user', color: 'text-purple-500', title: 'Livreur assigne', detail: 'Jean L. → DEL-001' },
  { time: '10:41', icon: 'truck', color: 'text-[#FF7A00]', title: 'Ramassage effectue', detail: 'DEL-001 chez Prestige Pressing' },
  { time: '11:02', icon: 'check', color: 'text-[#22C55E]', title: 'Livraison confirmee', detail: 'DEL-001 — Patrick M.' },
];

const hashToPercent = (seed: string, offset: number): string => {
  let hash = offset;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  return `${12 + (hash % 76)}%`;
};

const getMarkerColor = (delivery: DeliveryRow): string => {
  if (delivery.urgentIssue && !delivery.urgentResolved) return 'bg-red-500';
  if (delivery.status === 'Livre') return 'bg-[#22C55E]';
  if (delivery.status === 'Echec') return 'bg-red-500';
  if (delivery.status === 'En attente') return 'bg-[#FF7A00]';
  return 'bg-brand-blue';
};

const getMarkerStatusLabel = (delivery: DeliveryRow): string => {
  if (delivery.urgentIssue && !delivery.urgentResolved) return 'Urgent';
  if (delivery.status === 'En livraison' || delivery.status === 'En route') return 'En cours';
  if (delivery.status === 'En attente') return 'Ramassage';
  if (delivery.status === 'Echec') return 'Retard';
  return delivery.status;
};

const readStoredDeliveryOps = (partnerId: string) => {
  const dbPartners = DB.get('partners') as Partner[];
  const stored = dbPartners.find((p) => p.id === partnerId)?.deliveryOps;
  const storedDrivers = stored?.drivers?.length ? stored.drivers : DEFAULT_DRIVERS;
  if (stored?.deliveries?.length) {
    return {
      deliveries: stored.deliveries,
      activityLog: stored.activityLog?.length ? stored.activityLog : DEFAULT_ACTIVITY_LOG,
      drivers: storedDrivers,
    };
  }
  return {
    deliveries: createInitialDeliveries(driverNames(storedDrivers)),
    activityLog: DEFAULT_ACTIVITY_LOG,
    drivers: storedDrivers,
  };
};

/* ─── SVG Donut ─── */
const Donut: React.FC<{ segments: { value: number; color: string }[]; size?: number }> = ({ segments, size = 100 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = 35; const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      {segments.map((seg, i) => {
        const pct = (seg.value / total) * 100;
        const dash = (pct / 100) * c;
        const prev = cumulative;
        cumulative += pct;
        return <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="8" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-prev / 100 * c} />;
      })}
    </svg>
  );
};

/* ─── MAIN DELIVERY V2 ─── */
export const DeliverySettings: React.FC<DeliveryProps> = ({ setSection }) => {
  const { user, partners, formatPrice, addNotification, apiUpdatePartnerDeliveryOps } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered' | 'issues'>('all');
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>(() => createInitialDeliveries());
  const [drivers, setDrivers] = useState<PartnerDeliveryDriver[]>(DEFAULT_DRIVERS);
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [interventionModal, setInterventionModal] = useState<InterventionContext | null>(null);
  const [activityLog, setActivityLog] = useState<PartnerDeliveryActivityEntry[]>(DEFAULT_ACTIVITY_LOG);
  const [hydrated, setHydrated] = useState(false);

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  useEffect(() => {
    if (!partner) return;
    const stored = readStoredDeliveryOps(partner.id);
    setDeliveries(stored.deliveries);
    setActivityLog(stored.activityLog);
    setDrivers(stored.drivers);
    setHydrated(true);
  }, [partner?.id]);

  const persistDeliveryOps = useCallback(
    async (
      nextDeliveries: DeliveryRow[],
      nextActivityLog: PartnerDeliveryActivityEntry[],
      nextDrivers: PartnerDeliveryDriver[],
    ) => {
      if (!partner) return;
      try {
        await apiUpdatePartnerDeliveryOps(partner.id, {
          deliveries: nextDeliveries,
          activityLog: nextActivityLog,
          drivers: nextDrivers,
        });
      } catch {
        addNotification('Impossible de sauvegarder les livraisons.', 'error');
      }
    },
    [partner, apiUpdatePartnerDeliveryOps, addNotification],
  );

  useEffect(() => {
    if (!partner || !hydrated) return;
    persistDeliveryOps(deliveries, activityLog, drivers);
  }, [partner?.id, deliveries, activityLog, drivers, hydrated, persistDeliveryOps]);

  const activeDriverNames = useMemo(
    () => drivers.filter((d) => d.state !== 'Inactif').map((d) => d.name),
    [drivers],
  );

  const activeOrdersByDriver = useMemo(() => {
    const counts: Record<string, number> = {};
    deliveries.forEach((d) => {
      if (d.status !== 'Livre') counts[d.driver] = (counts[d.driver] || 0) + 1;
    });
    return counts;
  }, [deliveries]);

  const handleCreateDelivery = (values: NewDeliveryFormValues) => {
    const now = new Date();
    const nextIndex = deliveries.length + 1;
    const created: DeliveryRow = {
      id: `DEL-2026-${String(nextIndex).padStart(3, '0')}`,
      orderNumber: values.orderNumber || `ORDER-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`,
      client: values.client,
      commune: values.commune,
      driver: values.driver,
      amount: values.amount,
      status: 'En attente',
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('fr-FR'),
    };
    setDeliveries((prev) => [created, ...prev]);
    setActivityLog((prev) => [
      {
        time: created.time,
        icon: 'truck',
        color: 'text-brand-blue',
        title: `Livraison ${created.id} creee`,
        detail: `${created.client} — ${created.commune} • ${created.driver}`,
      },
      ...prev,
    ]);
    setShowNewDeliveryModal(false);
    setActiveTab('all');
    addNotification(`Livraison ${created.id} creee pour ${created.client}.`, 'success');
  };

  const urgentInterventions = useMemo<UrgentInterventionView[]>(
    () =>
      deliveries
        .filter((d) => d.urgentIssue && d.urgentAction && !d.urgentResolved)
        .map((d) => ({
          deliveryId: d.id,
          issue: d.urgentIssue!,
          actionType: d.urgentAction!,
          actionLabel: URGENT_ACTION_LABELS[d.urgentAction!],
          client: d.client,
          driver: d.driver,
        })),
    [deliveries],
  );

  const pushActivity = (entry: { icon: string; color: string; title: string; detail: string }) => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setActivityLog((prev) => [{ time, ...entry }, ...prev]);
  };

  const handleSaveDrivers = (updated: PartnerDeliveryDriver[]) => {
    setDrivers(updated);
    pushActivity({
      icon: 'users',
      color: 'text-brand-blue',
      title: 'Equipe livreurs mise a jour',
      detail: `${updated.filter((d) => d.state !== 'Inactif').length} livreurs actifs`,
    });
    addNotification('Liste des livreurs enregistree.', 'success');
  };

  const openInterventionModal = (intervention: UrgentInterventionView) => {
    const delivery = deliveries.find((d) => d.id === intervention.deliveryId);
    if (!delivery) {
      addNotification(`Livraison ${intervention.deliveryId} introuvable.`, 'error');
      return;
    }
    setInterventionModal({
      deliveryId: intervention.deliveryId,
      issue: intervention.issue,
      client: intervention.client,
      driver: intervention.driver,
      commune: delivery.commune,
      actionType: intervention.actionType,
    });
  };

  const applyInterventionResult = (ctx: InterventionContext, result: InterventionResult) => {
    const delivery = deliveries.find((d) => d.id === ctx.deliveryId);
    if (!delivery) return;

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setInterventionModal(null);

    if (result.actionType === 'contact') {
      const channelLabels = { call: 'Appel', sms: 'SMS', whatsapp: 'WhatsApp' };
      const followUpLabels = {
        none: '',
        recall_15: ' • Rappel dans 15 min',
        reschedule: ' • Livraison reprogrammee',
      };
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === ctx.deliveryId ? { ...d, status: 'En attente', urgentResolved: true, time: now } : d,
        ),
      );
      pushActivity({
        icon: 'phone',
        color: 'text-brand-blue',
        title: `${channelLabels[result.channel]} — ${ctx.deliveryId}`,
        detail: `${delivery.client}${result.note ? ` • ${result.note}` : ''}${followUpLabels[result.followUp]}`,
      });
      addNotification(
        `${channelLabels[result.channel]} lance vers ${delivery.client} (${delivery.commune}).`,
        'success',
      );
      return;
    }

    if (result.actionType === 'reassign') {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === ctx.deliveryId
            ? { ...d, driver: result.newDriver, status: 'En route', urgentResolved: true, time: now }
            : d,
        ),
      );
      pushActivity({
        icon: 'user',
        color: 'text-purple-500',
        title: `Reassignation (${result.priority}) — ${ctx.deliveryId}`,
        detail: `${delivery.driver} → ${result.newDriver} • ${result.reason}${result.notifyClient ? ' • Client notifie' : ''}`,
      });
      addNotification(
        `Livraison ${ctx.deliveryId} reassignee a ${result.newDriver} (${result.reason}).`,
        'success',
      );
      return;
    }

    const destLabels = { support: 'Support partenaire', manager: 'Manager logistique', platform: 'Plateforme LE' };
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === ctx.deliveryId ? { ...d, status: 'Echec', urgentResolved: true, time: now } : d,
      ),
    );
    pushActivity({
      icon: 'warning',
      color: 'text-red-500',
      title: `Escalade ${result.priority} — ${ctx.deliveryId}`,
      detail: `${destLabels[result.destination]} • ${result.category} • ${result.assignTo}`,
    });
    addNotification(
      `Ticket cree (${result.category}) assigne a ${result.assignTo}. Priorite : ${result.priority}.`,
      'info',
    );
  };

  const handleExport = (label: string, format: string) => {
    addNotification(`Export ${label} (${format}) en cours de preparation…`, 'info');
  };

  const filteredDeliveries = useMemo(() => {
    let result = deliveries;
    if (activeTab === 'active') result = result.filter(d => d.status === 'En livraison' || d.status === 'En route');
    else if (activeTab === 'delivered') result = result.filter(d => d.status === 'Livre');
    else if (activeTab === 'issues') {
      result = result.filter(
        (d) => d.status === 'Echec' || (d.urgentIssue && !d.urgentResolved),
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d => d.client.toLowerCase().includes(q) || d.commune.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    }
    return result;
  }, [deliveries, activeTab, search]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const inProgress = deliveries.filter(d => d.status === 'En livraison' || d.status === 'En route').length;
    const delivered = deliveries.filter(d => d.status === 'Livre').length;
    const failed = deliveries.filter(
      (d) => d.status === 'Echec' || (d.urgentIssue && !d.urgentResolved),
    ).length;
    return { inProgress, toDeliver: 3, deliveredToday: 18, avgTime: 45, successRate: 98, delays: 2, disputes: 1, revenue: 125 };
  }, [deliveries]);

  const mapDriverMarkers = useMemo(() => {
    const activeNames = drivers
      .filter((drv) => drv.state !== 'Inactif')
      .map((drv) => drv.name)
      .filter((name) =>
        deliveries.some(
          (d) => d.driver === name && (d.status === 'En livraison' || d.status === 'En route' || d.status === 'En attente'),
        ),
      );
    return activeNames.map((name, i) => ({
      name,
      orders: deliveries.filter((d) => d.driver === name && d.status !== 'Livre').length,
      x: hashToPercent(name, i + 3),
      y: hashToPercent(name + 'driver', i + 7),
      color: deliveries.some((d) => d.driver === name && d.urgentIssue && !d.urgentResolved)
        ? 'bg-red-500'
        : 'bg-brand-blue',
      pulse: deliveries.some((d) => d.driver === name && d.urgentIssue && !d.urgentResolved),
    }));
  }, [deliveries, drivers]);

  const mapDeliveryMarkers = useMemo(
    () =>
      deliveries
        .filter((d) => d.status !== 'Livre' || (d.urgentIssue && !d.urgentResolved))
        .slice(0, 10)
        .map((d) => ({
          id: d.id,
          label: d.id.replace('DEL-2026-', 'DEL-'),
          x: hashToPercent(d.id + d.commune, 1),
          y: hashToPercent(d.id + d.driver, 2),
          status: getMarkerStatusLabel(d),
          color: getMarkerColor(d),
          pulse: !!(d.urgentIssue && !d.urgentResolved),
        })),
    [deliveries],
  );

  const zones = useMemo(() => [
    { commune: 'Gombe', volume: 120, avgTime: '24 min', cost: 0, satisfaction: 4.9, profitability: 92, deliveries: 42 },
    { commune: 'Ngaliema', volume: 85, avgTime: '35 min', cost: 1, satisfaction: 4.7, profitability: 85, deliveries: 18 },
    { commune: 'Limete', volume: 62, avgTime: '30 min', cost: 1, satisfaction: 4.8, profitability: 88, deliveries: 12 },
    { commune: 'Kintambo', volume: 45, avgTime: '40 min', cost: 2, satisfaction: 4.5, profitability: 78, deliveries: 8 },
    { commune: 'Bandalungwa', volume: 38, avgTime: '45 min', cost: 2, satisfaction: 4.4, profitability: 72, deliveries: 5 },
  ], []);

  const driverAvatar = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const driverOptionsForModal = useMemo(
    () =>
      drivers.map((d) => ({
        name: d.name,
        state: d.state,
        rating: d.rating,
        activeOrders: deliveries.filter((del) => del.driver === d.name && del.status !== 'Livre').length,
      })),
    [deliveries, drivers],
  );

  const disputes = useMemo(() => [
    { id: 'DISP-001', client: 'Patrick M.', reason: 'Client absent', status: 'En attente', amount: 18 },
    { id: 'DISP-002', client: 'Sarah K.', reason: 'Adresse erronée', status: 'Resolu', amount: 12 },
    { id: 'DISP-003', client: 'Alain T.', reason: 'Article manquant', status: 'En cours', amount: 24 },
  ], []);

  if (!partner) return null;

  const getStatusStyle = (status: string) => {
    const s: Record<string, { color: string; bg: string }> = {
      'En livraison': { color: 'text-sky-400', bg: 'bg-sky-500/20' },
      'En route': { color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
      'Livre': { color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
      'En attente': { color: 'text-orange-400', bg: 'bg-orange-500/20' },
      'Echec': { color: 'text-red-400', bg: 'bg-red-500/20' },
    };
    return s[status] || { color: 'text-content-muted', bg: 'bg-surface-muted' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-content-primary">Livraisons Enterprise</h1>
          <p className="text-sm text-content-muted mt-1">Centre de controle logistique complet.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('Livraisons', 'Excel')}
            className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-xs font-bold transition hover:bg-surface-muted"
          >
            <Icon name="arrow-down-tray" className="h-3.5 w-3.5" />
            Exporter
          </button>
          <button
            type="button"
            onClick={() => setShowNewDeliveryModal(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-blue-700"
          >
            <Icon name="plus" className="h-4 w-4" />
            Nouvelle livraison
          </button>
        </div>
      </div>

      {/* ─── Section 1: 8 KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'En cours', value: String(stats.inProgress), change: '+12%', icon: 'truck', bg: 'bg-blue-50', color: 'text-brand-blue' },
          { label: 'A livrer', value: String(stats.toDeliver), icon: 'clock', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Livre aujourd.', value: String(stats.deliveredToday), icon: 'check', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Temps moyen', value: `${stats.avgTime} min`, icon: 'clock', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Taux reussite', value: `${stats.successRate}%`, icon: 'shield-check', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Retards', value: String(stats.delays), icon: 'warning', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Litiges', value: String(stats.disputes), icon: 'xmark', bg: 'bg-red-50', color: 'text-red-500' },
          { label: 'Revenus livraison', value: formatPrice(stats.revenue), icon: 'currencyDollar', bg: 'bg-cyan-50', color: 'text-cyan-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface-card rounded-xl border border-surface-border-subtle p-3 hover:shadow-md transition">
            <div className={`p-1.5 rounded-lg ${kpi.bg} w-fit mb-1.5`}><Icon name={kpi.icon as any} className={`w-3.5 h-3.5 ${kpi.color}`} /></div>
            <p className="text-[9px] text-content-muted mb-0.5">{kpi.label}</p>
            <p className="text-base font-extrabold text-content-primary">{kpi.value}</p>
            {kpi.change && <p className="text-[9px] font-bold text-[#22C55E]">{kpi.change}</p>}
          </div>
        ))}
      </div>

      {/* ─── Section 2: Carte temps reel + Section 3: Livreurs ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Centre logistique temps reel</h2>
          <div className="relative h-72 overflow-hidden rounded-xl bg-surface-muted">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, #cbd5e1 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, #cbd5e1 30px)', backgroundSize: '30px 30px' }} />
            <div className="absolute inset-0">
              {mapDriverMarkers.map((d) => (
                <div key={d.name} className="absolute" style={{ left: d.x, top: d.y }}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ${d.color} ${d.pulse ? 'animate-pulse' : ''}`}>
                    {d.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <p className="mt-0.5 whitespace-nowrap text-center text-[9px] font-medium text-content-muted">{d.name} • {d.orders} cmd</p>
                </div>
              ))}
              {mapDeliveryMarkers.map((l) => (
                <div key={l.id} className="absolute" style={{ left: l.x, top: l.y }} title={`${l.id} — ${l.status}`}>
                  <div className={`flex h-5 w-5 items-center justify-center rounded ${l.color} ${l.pulse ? 'animate-pulse ring-2 ring-red-300' : ''}`}>
                    <Icon name="shoppingBag" className="h-3 w-3 text-white" />
                  </div>
                  <p className="mt-0.5 text-[8px] font-medium text-content-muted">{l.label}</p>
                </div>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 bg-surface-card/90 rounded-lg px-3 py-1.5 text-[10px] font-medium text-content-muted flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]" />Livre</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-blue" />En cours</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF7A00]" />Ramassage</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Retard</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Livreurs actifs</h2>
          <div className="space-y-2">
            {drivers.filter(d => d.state === 'Actif' || d.state === 'En tournee').map((d, i) => (
              <div key={d.id} className="p-3 bg-surface-muted rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-[10px]">{driverAvatar(d.name)}</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-content-primary">{d.name}</p>
                    <p className="text-[9px] text-content-muted">{d.total} livraisons • {d.remaining}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#22C55E]">{d.rating}</p>
                    <p className="text-[9px] text-content-muted">{d.success}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 4: Urgences + Section 5: Performance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-red-100 rounded-lg"><Icon name="warning" className="w-4 h-4 text-red-500" /></div>
            <h2 className="text-sm font-bold text-red-400">Intervention immediate</h2>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-400">
              {urgentInterventions.length} alerte{urgentInterventions.length > 1 ? 's' : ''} active{urgentInterventions.length > 1 ? 's' : ''}
            </span>
            {urgentInterventions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('issues')}
                className="text-[10px] font-bold text-red-400 hover:underline"
              >
                Voir dans la liste →
              </button>
            )}
          </div>
          <div className="space-y-2">
            {urgentInterventions.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <Icon name="check" className="mx-auto mb-1 h-5 w-5 text-[#22C55E]" />
                <p className="text-xs font-bold text-content-primary">Aucune intervention requise</p>
                <p className="text-[10px] text-content-muted">Toutes les alertes ont ete traitees.</p>
              </div>
            ) : (
              urgentInterventions.map((u) => (
                <div key={u.deliveryId} className="flex items-center justify-between rounded-xl border border-red-100 bg-surface-card p-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon name="warning" className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-content-primary">{u.issue}</p>
                      <p className="truncate text-[9px] text-content-muted">
                        {u.deliveryId} • {u.client} • {u.driver}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openInterventionModal(u)}
                    className="ml-2 shrink-0 rounded-lg bg-red-500 px-2 py-1 text-[9px] font-bold text-white hover:bg-red-600"
                  >
                    {u.actionLabel}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Performance livraison</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Temps moyen', value: '45 min', change: '-15 min', icon: 'clock', bg: 'bg-green-50', color: 'text-[#22C55E]' },
              { label: 'Taux reussite', value: '98%', change: '+2%', icon: 'check', bg: 'bg-blue-50', color: 'text-brand-blue' },
              { label: 'Litiges', value: '0.8%', change: '-0.3%', icon: 'warning', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
              { label: 'Satisfaction', value: '4.9/5', change: '+0.1', icon: 'star', bg: 'bg-yellow-50', color: 'text-yellow-500' },
            ].map((p, i) => (
              <div key={i} className="p-3 bg-surface-muted rounded-xl">
                <div className="flex items-center gap-1.5 mb-1"><Icon name={p.icon as any} className={`w-3.5 h-3.5 ${p.color}`} /><span className="text-[10px] text-content-muted">{p.label}</span></div>
                <p className="text-lg font-extrabold text-content-primary">{p.value}</p>
                <p className={`text-[9px] font-medium ${p.color}`}>{p.change}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 6: Top livreurs + Section 7: Zones ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Top livreurs</h2>
          <div className="space-y-2">
            {[...drivers].sort((a, b) => b.rating - a.rating).slice(0, 4).map((d, i) => (
              <div key={d.id} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-surface-muted'}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-content-muted w-4">{i + 1}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-brand-blue/10 text-brand-blue'}`}>{driverAvatar(d.name)}</div>
                  <div><p className="text-xs font-bold text-content-primary">{d.name}</p><p className="text-[9px] text-content-muted">{d.total} livraisons • {d.avgTime}</p></div>
                </div>
                <div className="text-right"><p className="text-sm font-extrabold text-content-primary">{d.rating}</p><p className="text-[9px] text-[#22C55E]">{d.success}%</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Zones de livraison</h2>
          <div className="space-y-2">
            {zones.map((z, i) => (
              <div key={i} className="p-3 bg-surface-muted rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-content-primary">{z.commune}</span>
                  <span className="text-xs font-bold text-content-primary">{z.deliveries} cmd</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-content-muted">
                  <span>{z.avgTime}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Icon name="star" className="w-2.5 h-2.5 text-yellow-400" />{z.satisfaction}</span>
                  <span>•</span>
                  <span className="text-[#22C55E]">{z.profitability}% rent.</span>
                </div>
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-brand-blue rounded-full" style={{ width: `${z.profitability}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 8: Previsions IA + Section 9: Rentabilite ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-brand-blue to-brand-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="sparkles" className="w-5 h-5" />
            <h2 className="text-sm font-bold">Previsions IA — Demain</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-surface-card/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Livraisons prevues</p><p className="text-xl font-extrabold">24</p></div>
            <div className="bg-surface-card/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Zone la plus active</p><p className="text-xl font-extrabold">Gombe</p></div>
            <div className="bg-surface-card/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Pic d'activite</p><p className="text-xl font-extrabold">17h-19h</p></div>
            <div className="bg-surface-card/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Livreurs recommandes</p><p className="text-xl font-extrabold">3</p></div>
          </div>
          <button
            type="button"
            onClick={() => addNotification('Optimisation IA des tournées lancée.', 'info')}
            className="w-full rounded-xl bg-surface-card/20 py-2 text-xs font-bold text-white transition hover:bg-surface-card/30"
          >
            Optimiser automatiquement
          </button>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Rentabilite livraison</h2>
          <div className="flex items-center gap-6 mb-4">
            <Donut segments={[
              { value: 120, color: '#22C55E' },
              { value: 20, color: '#FF7A00' },
              { value: 25, color: '#EF4444' },
            ]} size={100} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" />Revenu</span><span className="font-bold">{formatPrice(120)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF7A00]" />Cout livreur</span><span className="font-bold">{formatPrice(20)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Cout carburant</span><span className="font-bold">{formatPrice(25)}</span></div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-content-primary">Marge livraison</span>
            <span className="text-lg font-extrabold text-[#22C55E]">{formatPrice(75)}</span>
          </div>
        </div>
      </div>

      {/* ─── Section 10: Litiges + Section 11: Activite ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Litiges ({disputes.length})</h2>
          <div className="space-y-2">
            {disputes.map((d, i) => {
              const st = d.status === 'Resolu' ? 'bg-green-50 text-[#22C55E]' : d.status === 'En cours' ? 'bg-orange-50 text-[#FF7A00]' : 'bg-blue-50 text-brand-blue';
              return (
                <div key={i} className="p-3 bg-surface-muted rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-content-muted">{d.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st}`}>{d.status}</span>
                  </div>
                  <p className="text-xs font-bold text-content-primary">{d.client}</p>
                  <p className="text-[10px] text-content-muted">{d.reason} • {formatPrice(d.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
          <h2 className="text-sm font-bold text-content-primary mb-3">Activite logistique</h2>
          <div className="space-y-2.5">
            {activityLog.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="shrink-0 rounded-lg bg-surface-muted p-1"><Icon name={a.icon as any} className={`w-3 h-3 ${a.color}`} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-content-primary">{a.title}</p>
                  <p className="text-[9px] text-content-muted truncate">{a.detail}</p>
                </div>
                <span className="text-[9px] text-content-muted shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 12: Livraisons principales ─── */}
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-content-primary">Toutes les livraisons ({filteredDeliveries.length})</h2>
        </div>
        <div className="relative mb-3">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>
        <div className="flex gap-1.5 mb-3">
          {(['all', 'active', 'delivered', 'issues'] as const).map(f => {
            const labels = { all: 'Toutes', active: 'En cours', delivered: 'Livrees', issues: 'Problemes' };
            return <button key={f} onClick={() => setActiveTab(f)} className={`rounded-lg px-3 py-1 text-[10px] font-bold transition ${activeTab === f ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-muted'}`}>{labels[f]}</button>;
          })}
        </div>
        <div className="space-y-2">
          {filteredDeliveries.slice(0, 8).map((d) => {
            const st = getStatusStyle(d.status);
            const initials = d.client.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={d.id} className="p-3 bg-surface-muted rounded-xl flex items-center justify-between hover:bg-surface-muted transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">{initials}</div>
                  <div><p className="text-xs font-bold text-content-primary">{d.client}</p><p className="text-[9px] text-content-muted">{d.id} • {d.commune} • {d.driver}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{d.status}</span>
                  <span className="text-xs font-extrabold text-content-primary">{formatPrice(d.amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Section 13: Exports + Section 14: Footer ─── */}
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
        <h2 className="text-sm font-bold text-content-primary mb-3">Rapports & Export</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: 'document-text', label: 'Rapport logistique', format: 'PDF', color: 'text-red-500' },
            { icon: 'arrow-down-tray', label: 'Rapport livreurs', format: 'Excel', color: 'text-[#22C55E]' },
            { icon: 'arrow-down-tray', label: 'Rapport zones', format: 'CSV', color: 'text-brand-blue' },
            { icon: 'document-text', label: 'Rapport rentabilite', format: 'PDF', color: 'text-red-500' },
          ].map((exp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleExport(exp.label, exp.format)}
              className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 transition hover:bg-surface-muted"
            >
              <Icon name={exp.icon as any} className={`w-5 h-5 ${exp.color}`} />
              <div className="text-left"><p className="text-xs font-bold text-content-primary">{exp.label}</p><p className="text-[9px] text-content-muted">{exp.format}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-700 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🚀</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Optimisez vos livraisons</h3>
            <p className="text-xs text-white/80">Assignez un livreur et gagnez du temps sur vos livraisons.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDriverModal(true)}
          className={partnerCtaLight}
        >
          Gerer mes livreurs
        </button>
      </div>

      <NewDeliveryModal
        isOpen={showNewDeliveryModal}
        communes={COMMUNES}
        drivers={activeDriverNames.length ? activeDriverNames : driverNames(DEFAULT_DRIVERS)}
        onClose={() => setShowNewDeliveryModal(false)}
        onSave={handleCreateDelivery}
      />

      <InterventionActionModal
        isOpen={!!interventionModal}
        intervention={interventionModal}
        drivers={driverOptionsForModal}
        onClose={() => setInterventionModal(null)}
        onConfirm={(result) => interventionModal && applyInterventionResult(interventionModal, result)}
      />

      <DriverManagementModal
        isOpen={showDriverModal}
        drivers={drivers}
        communes={COMMUNES}
        activeOrdersByDriver={activeOrdersByDriver}
        onClose={() => setShowDriverModal(false)}
        onSave={handleSaveDrivers}
      />
    </div>
  );
};
