import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import {
  realApi,
  type AdminSupportTicket,
  type BackendActivityLogDashboardResponse,
  type BackendCampaignDashboardResponse,
  type BackendClaimsDashboardResponse,
  type BackendLoyaltyDashboardResponse,
  type BackendPaymentGatewaysDashboardResponse,
  type BackendReviewsDashboardResponse,
  type BackendSupportDashboardResponse,
  type LogisticsDriver,
  type LogisticsMaintenanceEvent,
  type LogisticsTask,
  type LogisticsVehicle,
  type MarketplaceCompany,
  type Order,
} from '../../services/real-api';
import { logisticsCard } from './logistics-ui';

const PERIODS = ['Aujourd’hui', 'Cette semaine', 'Ce mois'] as const;
type PerformancePeriod = typeof PERIODS[number];

type FetchState<T> = { ok: true; data: T } | { ok: false; error: string };
type TrendPoint = { label: string; value: number };
type AlertItem = { type: string; reference: string; commune: string; impact: string; severity: 'critical' | 'warning' | 'watch' };
type HealthStatus = 'SAIN' | 'ATTENTION' | 'CRITIQUE';

const PERIOD_DAYS: Record<PerformancePeriod, number> = {
  'Aujourd’hui': 1,
  'Cette semaine': 7,
  'Ce mois': 30,
};

const moneyFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const inLastDays = (value: string | null | undefined, days: number) => {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return date >= start;
};

const statusIn = (status: string | null | undefined, values: string[]) => values.includes((status || '').toLowerCase());

const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

async function safeFetch<T>(label: string, loader: () => Promise<T>): Promise<FetchState<T>> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    return { ok: false, error: `${label}: ${error instanceof Error ? error.message : 'source indisponible'}` };
  }
}

function getSourceError(source: FetchState<unknown>) {
  return 'error' in source ? source.error : null;
}

function groupByDate(items: Array<{ date: string | null; value: number }>, days: number): TrendPoint[] {
  const buckets = new Map<string, number>();
  const totalBuckets = days === 1 ? 6 : days === 7 ? 7 : 6;

  for (let index = totalBuckets - 1; index >= 0; index -= 1) {
    const date = new Date();
    if (days === 1) {
      date.setHours(date.getHours() - index * 4, 0, 0, 0);
      buckets.set(`${date.getHours()}h`, 0);
    } else if (days === 7) {
      date.setDate(date.getDate() - index);
      buckets.set(date.toLocaleDateString('fr-FR', { weekday: 'short' }), 0);
    } else {
      date.setDate(date.getDate() - index * 5);
      buckets.set(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), 0);
    }
  }

  items.forEach((item) => {
    const date = parseDate(item.date);
    if (!date) return;
    let key: string;
    if (days === 1) {
      key = `${Math.floor(date.getHours() / 4) * 4}h`;
    } else if (days === 7) {
      key = date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      const bucketDate = new Date(date);
      bucketDate.setDate(bucketDate.getDate() - (bucketDate.getDate() % 5));
      key = bucketDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + item.value);
  });

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

function MiniLineChart({ data, color }: { data: TrendPoint[]; color: string }) {
  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const width = 420;
  const height = 150;
  const padding = 22;
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - (d.value / maxVal) * (height - padding * 2),
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = points.length ? `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id={`truth-line-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map((tick) => (
        <line key={tick} x1={padding} y1={height - padding - tick * (height - padding * 2)} x2={width - padding} y2={height - padding - tick * (height - padding * 2)} stroke="#E5E7EB" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#truth-line-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle key={data[index].label} cx={point.x} cy={point.y} r="4" fill="white" stroke={color} strokeWidth="2" />
      ))}
      {data.map((d, index) => (
        <text key={d.label} x={padding + index * stepX} y={height - 5} textAnchor="middle" className="fill-gray-500 text-[10px]">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

function HorizontalBars({ data, color }: { data: Array<{ label: string; value: number }>; color: string }) {
  const maxVal = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <p className="rounded-2xl bg-surface-muted p-4 text-sm text-content-muted">Aucune donnée backend disponible.</p>
      ) : (
        data.map((item) => (
          <div key={item.label} className="grid grid-cols-[92px_1fr_54px] items-center gap-3 text-sm">
            <span className="truncate font-semibold text-content-primary">{item.label}</span>
            <div className="h-4 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: color }} />
            </div>
            <span className="text-right font-bold text-content-primary">{numberFormatter.format(item.value)}</span>
          </div>
        ))
      )}
    </div>
  );
}

function CircularGauge({ value, label }: { value: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="flex items-center justify-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} stroke="#E5E7EB" strokeWidth="12" fill="none" />
          <circle cx="60" cy="60" r={radius} stroke="#2563EB" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-content-primary">{value}%</span>
          <span className="max-w-20 text-xs text-content-muted">{label}</span>
        </div>
      </div>
    </div>
  );
}

export const LogisticsPerformance: React.FC = () => {
  const [period, setPeriod] = useState<PerformancePeriod>('Aujourd’hui');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [sources, setSources] = useState<{
    orders: FetchState<Order[]>;
    tasks: FetchState<LogisticsTask[]>;
    drivers: FetchState<LogisticsDriver[]>;
    vehicles: FetchState<LogisticsVehicle[]>;
    maintenance: FetchState<LogisticsMaintenanceEvent[]>;
    tickets: FetchState<AdminSupportTicket[]>;
    support: FetchState<BackendSupportDashboardResponse>;
    claims: FetchState<BackendClaimsDashboardResponse>;
    reviews: FetchState<BackendReviewsDashboardResponse>;
    loyalty: FetchState<BackendLoyaltyDashboardResponse>;
    campaigns: FetchState<BackendCampaignDashboardResponse>;
    payments: FetchState<BackendPaymentGatewaysDashboardResponse>;
    activity: FetchState<BackendActivityLogDashboardResponse>;
    partners: FetchState<MarketplaceCompany[]>;
  } | null>(null);

  const days = PERIOD_DAYS[period];

  const loadTruthCenter = useCallback(async () => {
    setLoading(true);
    const [
      orders,
      tasks,
      drivers,
      vehicles,
      maintenance,
      tickets,
      support,
      claims,
      reviews,
      loyalty,
      campaigns,
      payments,
      activity,
      partners,
    ] = await Promise.all([
      safeFetch('orders', async () => (await realApi.getOrders({ page: 1, page_size: 250 })).orders),
      safeFetch('logistics tasks', async () => (await realApi.getLogisticsTasks({ page: 1, page_size: 250 })).tasks),
      safeFetch('drivers', async () => (await realApi.getLogisticsDrivers({ page: 1, page_size: 250 })).drivers),
      safeFetch('vehicles', async () => (await realApi.getVehicles()).vehicles),
      safeFetch('maintenance', async () => (await realApi.getMaintenanceEvents()).maintenance_events),
      safeFetch('support tickets', () => realApi.getSupportTickets()),
      safeFetch('support truth', () => realApi.getSupportDashboard(days)),
      safeFetch('claims truth', () => realApi.getClaimsDashboard(days)),
      safeFetch('reviews truth', () => realApi.getReviewsDashboard(days)),
      safeFetch('loyalty truth', () => realApi.getLoyaltyDashboard(days)),
      safeFetch('promotion truth', () => realApi.getCampaignDashboard(days)),
      safeFetch('payment truth', () => realApi.getPaymentGatewaysDashboard(days)),
      safeFetch('activity truth', () => realApi.getActivityLogDashboard(80)),
      safeFetch('partners', async () => (await realApi.getMarketplaceCompanies({ page: 1, page_size: 100 })).companies),
    ]);
    setSources({ orders, tasks, drivers, vehicles, maintenance, tickets, support, claims, reviews, loyalty, campaigns, payments, activity, partners });
    setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void loadTruthCenter();
    const refresh = window.setInterval(() => void loadTruthCenter(), 30_000);
    return () => window.clearInterval(refresh);
  }, [loadTruthCenter]);

  const model = useMemo(() => {
    const orders = sources?.orders.ok ? sources.orders.data.filter((order) => inLastDays(order.created_at, days)) : [];
    const tasks = sources?.tasks.ok ? sources.tasks.data.filter((task) => inLastDays(task.created_at, days) || inLastDays(task.updated_at, days) || inLastDays(task.completed_at, days)) : [];
    const drivers = sources?.drivers.ok ? sources.drivers.data : [];
    const vehicles = sources?.vehicles.ok ? sources.vehicles.data : [];
    const maintenance = sources?.maintenance.ok ? sources.maintenance.data : [];
    const tickets = sources?.tickets.ok ? sources.tickets.data.filter((ticket) => inLastDays(ticket.created_at, days) || inLastDays(ticket.updated_at, days)) : [];
    const support = sources?.support.ok ? sources.support.data : null;
    const claims = sources?.claims.ok ? sources.claims.data : null;
    const reviews = sources?.reviews.ok ? sources.reviews.data : null;
    const loyalty = sources?.loyalty.ok ? sources.loyalty.data : null;
    const campaigns = sources?.campaigns.ok ? sources.campaigns.data : null;
    const payments = sources?.payments.ok ? sources.payments.data : null;
    const activity = sources?.activity.ok ? sources.activity.data : null;
    const partners = sources?.partners.ok ? sources.partners.data : [];

    const pickupOpenStatuses = ['pending', 'open_market', 'claimed', 'driver_assigned', 'accepted', 'in_progress'];
    const completedTasks = tasks.filter((task) => statusIn(task.status, ['completed']));
    const failedTasks = tasks.filter((task) => statusIn(task.status, ['failed', 'expired', 'cancelled']));
    const pickupDone = tasks.filter((task) => task.task_type === 'pickup' && statusIn(task.status, ['completed', 'in_progress', 'accepted', 'driver_assigned']));
    const deliveryDone = tasks.filter((task) => task.task_type === 'delivery' && statusIn(task.status, ['completed']));
    const paidOrders = orders.filter((order) => statusIn(order.payment_status, ['paid', 'confirmed', 'completed', 'succeeded', 'validated']));
    const openTickets = tickets.filter((ticket) => !statusIn(ticket.status, ['closed', 'resolved']));
    const criticalClaims = claims?.claims.filter((claim) => claim.priority === 'critical' || claim.sla_state === 'breached') || [];
    const paymentIncidents = payments?.incidents || [];
    const maintenanceAlerts = maintenance.filter((event) => statusIn(event.status, ['open', 'overdue', 'in_progress']));
    const unavailableVehicles = vehicles.filter((vehicle) => vehicle.maintenance.status === 'overdue' || statusIn(vehicle.status, ['failed', 'cancelled', 'delayed']));
    const activeDrivers = drivers.filter((driver) => driver.status === 'active');
    const availableDrivers = activeDrivers.filter((driver) => driver.is_available);
    const avgMinutesSource = completedTasks
      .map((task) => {
        const start = parseDate(task.started_at || task.assigned_at || task.scheduled_at || task.created_at);
        const end = parseDate(task.completed_at);
        return start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : null;
      })
      .filter((value): value is number => value !== null);
    const averageMinutes = avgMinutesSource.length ? Math.round(avgMinutesSource.reduce((sum, item) => sum + item, 0) / avgMinutesSource.length) : null;
    const revenue = orders.reduce((sum, order) => sum + toNumber(order.total_amount), 0);
    const punctuality = percent(completedTasks.length, completedTasks.length + failedTasks.length);
    const completionRate = percent(deliveryDone.length || completedTasks.length, orders.length);

    const alerts: AlertItem[] = [
      ...failedTasks.map((task) => ({
        type: task.status === 'expired' ? 'Collecte manquée' : 'Retard livraison',
        reference: task.order_number || task.id,
        commune: task.delivery_commune || task.pickup_commune || 'Commune non renseignée',
        impact: task.status === 'failed' ? 'Mission échouée' : 'SLA à vérifier',
        severity: 'critical' as const,
      })),
      ...paymentIncidents.map((incident) => ({
        type: 'Paiement échoué',
        reference: incident.id,
        commune: incident.gateway_slug || 'Paiement',
        impact: incident.impact || incident.severity,
        severity: incident.severity === 'critical' ? 'critical' as const : 'warning' as const,
      })),
      ...criticalClaims.map((claim) => ({
        type: 'Réclamation ouverte',
        reference: claim.claim_number,
        commune: claim.partner_name || 'Support',
        impact: claim.sla_label || claim.priority_label,
        severity: 'critical' as const,
      })),
      ...unavailableVehicles.map((vehicle) => ({
        type: 'Partenaire indisponible',
        reference: vehicle.plate,
        commune: vehicle.zone || vehicle.location,
        impact: vehicle.maintenance.status === 'overdue' ? 'Maintenance overdue' : vehicle.status,
        severity: 'warning' as const,
      })),
      ...openTickets.slice(0, 4).map((ticket) => ({
        type: 'Ticket ouvert',
        reference: ticket.id,
        commune: ticket.category || 'Support',
        impact: ticket.priority,
        severity: ticket.priority === 'critical' ? 'critical' as const : 'watch' as const,
      })),
    ].slice(0, 8);

    const communeDeliveries = Array.from(
      completedTasks.reduce((map, task) => {
        const commune = task.delivery_commune || task.pickup_commune || 'Non renseignée';
        map.set(commune, (map.get(commune) || 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const zonePerformance = Array.from(
      tasks.reduce((map, task) => {
        const commune = task.delivery_commune || task.pickup_commune || 'Non renseignée';
        const current = map.get(commune) || { total: 0, success: 0 };
        current.total += 1;
        if (task.status === 'completed') current.success += 1;
        map.set(commune, current);
        return map;
      }, new Map<string, { total: number; success: number }>()),
    )
      .map(([commune, value]) => ({ commune, successRate: percent(value.success, value.total), total: value.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const topPartners = reviews?.top_partners?.length
      ? reviews.top_partners.slice(0, 5).map((partner) => ({ name: partner.partner_name, rating: partner.avg_rating, volume: partner.review_count }))
      : partners
          .filter((partner) => partner.is_active)
          .sort((a, b) => toNumber(b.rating_count) - toNumber(a.rating_count))
          .slice(0, 5)
          .map((partner) => ({ name: partner.name, rating: toNumber(partner.rating_avg), volume: partner.rating_count }));

    const health = [
      { label: 'Order Truth', status: (orders.length === 0 ? 'ATTENTION' : failedTasks.length > 3 ? 'CRITIQUE' : 'SAIN') as HealthStatus, detail: `${orders.length} commandes` },
      { label: 'Payment Truth', status: (paymentIncidents.length > 2 ? 'CRITIQUE' : paymentIncidents.length > 0 ? 'ATTENTION' : 'SAIN') as HealthStatus, detail: `${paymentIncidents.length} incidents` },
      { label: 'Logistics Truth', status: (failedTasks.length > 4 ? 'CRITIQUE' : failedTasks.length > 0 || unavailableVehicles.length > 0 ? 'ATTENTION' : 'SAIN') as HealthStatus, detail: `${failedTasks.length} anomalies` },
      { label: 'Support Truth', status: ((support?.kpis.critical_tickets || 0) > 0 || openTickets.length > 8 ? 'CRITIQUE' : openTickets.length > 0 ? 'ATTENTION' : 'SAIN') as HealthStatus, detail: `${support?.kpis.open_tickets ?? openTickets.length} ouverts` },
      { label: 'Review Truth', status: ((reviews?.negative_queue.length || 0) > 3 ? 'CRITIQUE' : (reviews?.kpis.low_star || 0) > 0 ? 'ATTENTION' : 'SAIN') as HealthStatus, detail: `${reviews?.kpis.total_reviews ?? 0} avis` },
      { label: 'Loyalty Truth', status: ((loyalty?.health.fraud_risk || 0) > 60 ? 'CRITIQUE' : (loyalty?.health.fraud_risk || 0) > 20 ? 'ATTENTION' : 'SAIN') as HealthStatus, detail: `${loyalty?.health.score ?? 0}/100` },
      { label: 'Promotion Truth', status: ((campaigns?.watchlist.length || 0) > 4 ? 'CRITIQUE' : (campaigns?.watchlist.length || 0) > 0 ? 'ATTENTION' : 'SAIN') as HealthStatus, detail: `${campaigns?.watchlist.length ?? 0} alertes` },
    ];

    const activityFeed = (activity?.live_events || activity?.events || [])
      .filter((event) => inLastDays(event.occurred_at, days))
      .slice(0, 8)
      .map((event) => ({
        label: event.action_label || event.action,
        reference: event.reference || event.resource_id || event.event_id,
        time: event.occurred_at ? new Date(event.occurred_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--',
        severity: event.severity,
      }));

    return {
      immediateCards: [
        { label: 'À collecter aujourd’hui', value: tasks.filter((task) => task.task_type === 'pickup' && pickupOpenStatuses.includes(task.status)).length, icon: 'shoppingBag' as const, tone: 'bg-blue-50 text-brand-blue', target: 'missions' },
        { label: 'À livrer aujourd’hui', value: tasks.filter((task) => task.task_type === 'delivery' && pickupOpenStatuses.includes(task.status)).length, icon: 'truck' as const, tone: 'bg-green-50 text-green-600', target: 'missions' },
        { label: 'Retards critiques', value: failedTasks.length, icon: 'clock' as const, tone: 'bg-orange-50 text-orange-600', target: 'alerts' },
        { label: 'Anomalies ouvertes', value: alerts.length, icon: 'warning' as const, tone: 'bg-red-50 text-red-600', target: 'alerts' },
        { label: 'Tickets ouverts', value: support?.kpis.open_tickets ?? openTickets.length, icon: 'chatBubble' as const, tone: 'bg-purple-50 text-purple-600', target: 'support' },
      ],
      corridor: [
        { label: 'Commandes créées', value: orders.length },
        { label: 'Paiements validés', value: paidOrders.length },
        { label: 'Collectes effectuées', value: pickupDone.length },
        { label: 'Livraisons réalisées', value: deliveryDone.length || completedTasks.length },
      ],
      completionRate,
      alerts,
      kpis: [
        { label: 'Missions complétées', value: numberFormatter.format(completedTasks.length), sub: `${completedTasks.length} tâches livrées backend`, icon: 'check' as const, tone: 'bg-green-50 text-green-600' },
        { label: 'Temps moyen global', value: averageMinutes === null ? '--' : `${averageMinutes} min`, sub: averageMinutes === null ? 'timestamps incomplets' : 'calculé depuis tâches terminées', icon: 'clock' as const, tone: 'bg-blue-50 text-brand-blue' },
        { label: 'Revenu total', value: `${moneyFormatter.format(revenue)} $`, sub: `${orders.length} commandes source`, icon: 'currencyDollar' as const, tone: 'bg-orange-50 text-orange-600' },
        { label: 'Ponctualité', value: `${punctuality}%`, sub: 'Objectif opérationnel: 95%', icon: 'hand-thumb-up' as const, tone: 'bg-purple-50 text-purple-600' },
      ],
      missionTrend: groupByDate(completedTasks.map((task) => ({ date: task.completed_at || task.updated_at, value: 1 })), days),
      revenueTrend: groupByDate(orders.map((order) => ({ date: order.created_at, value: toNumber(order.total_amount) })), days),
      communeDeliveries,
      zonePerformance,
      topPartners,
      activeDrivers: { active: activeDrivers.length, available: availableDrivers.length, total: drivers.length, percent: percent(activeDrivers.length, drivers.length) },
      fleet: {
        available: vehicles.filter((vehicle) => statusIn(vehicle.status, ['pending', 'assigned']) && vehicle.maintenance.status === 'ok').length,
        inMission: vehicles.filter((vehicle) => statusIn(vehicle.status, ['in_transit'])).length,
        maintenance: vehicles.filter((vehicle) => statusIn(vehicle.maintenance.status, ['scheduled', 'in_progress', 'overdue'])).length,
        out: unavailableVehicles.length,
        total: vehicles.length,
      },
      health,
      activityFeed,
      sourceErrors: sources ? Object.values(sources).map((source) => getSourceError(source)).filter((error): error is string => Boolean(error)) : [],
      backendOkCount: sources ? Object.values(sources).filter((source) => source.ok).length : 0,
    };
  }, [days, sources]);

  const triggerAction = (label: string, target: string) => {
    window.location.hash = target === 'support' ? '#reports' : `#${target}`;
    setActionMessage(`${label}: filtre opérationnel ouvert sur ${target === 'support' ? 'Support Truth / Rapports' : target}.`);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-content-primary md:text-3xl">CENTRE OPÉRATIONNEL</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${model.backendOkCount > 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {model.backendOkCount > 0 ? 'LIVE' : 'SOURCE PARTIELLE'}
              </span>
            </div>
            <p className="mt-1 text-sm text-content-muted">Pilotage temps réel des opérations Laundry Express</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex overflow-x-auto rounded-2xl bg-surface-muted p-1">
              {PERIODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPeriod(option)}
                  className={`min-h-10 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-colors ${period === option ? 'bg-white text-brand-blue shadow-sm' : 'text-content-muted hover:text-content-primary'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void loadTruthCenter()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 text-sm font-bold text-content-primary hover:bg-surface-muted">
              <Icon name="arrow-path" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <span className="text-xs font-semibold text-content-muted">Dernière synchro: {lastSync || '--'}</span>
          </div>
        </div>
      </section>

      {actionMessage && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-brand-blue">{actionMessage}</div>
      )}

      {model.sourceErrors.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          Sources partielles: {model.sourceErrors.slice(0, 4).join(' · ')}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {model.immediateCards.map((card) => (
          <button key={card.label} type="button" onClick={() => triggerAction(card.label, card.target)} className={`${logisticsCard} group p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${card.tone}`}>
                <Icon name={card.icon} className="h-6 w-6" />
              </span>
              <Icon name="arrowRight" className="h-5 w-5 text-content-muted transition group-hover:translate-x-1 group-hover:text-brand-blue" />
            </div>
            <p className="mt-4 text-sm font-semibold text-content-muted">{card.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-content-primary">{numberFormatter.format(card.value)}</p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-content-primary">Corridor de Vérité — Commandes</h2>
            <span className="text-xs font-bold text-content-muted">{period}</span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            {model.corridor.map((step, index) => {
              const previous = index > 0 ? model.corridor[index - 1].value : step.value;
              const loss = Math.max(0, previous - step.value);
              return (
                <button key={step.label} type="button" onClick={() => setActionMessage(`${step.label}: ${loss} pertes détectées depuis l’étape précédente.`)} className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-brand-blue/30">
                  <p className="text-sm font-semibold text-content-muted">{step.label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-brand-blue">{numberFormatter.format(step.value)}</p>
                  {index > 0 && <p className="mt-1 text-xs font-bold text-orange-600">{loss} pertes</p>}
                </button>
              );
            })}
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-content-primary">
              <span>Taux de complétion global</span>
              <span>{model.completionRate}%</span>
            </div>
            <div className="h-3 rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-brand-blue transition-all duration-300" style={{ width: `${Math.min(100, model.completionRate)}%` }} />
            </div>
          </div>
        </div>

        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-content-primary">Alertes & Exceptions</h2>
            <button type="button" onClick={() => triggerAction('Voir toutes les anomalies', 'alerts')} className="text-sm font-bold text-brand-blue">Voir tout</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <tbody>
                {model.alerts.length === 0 ? (
                  <tr><td className="rounded-2xl bg-green-50 p-4 font-semibold text-green-700">Aucune exception backend ouverte sur la période.</td></tr>
                ) : model.alerts.map((alert) => (
                  <tr key={`${alert.type}-${alert.reference}`} className="border-b border-gray-100 last:border-0">
                    <td className="py-3"><span className={`mr-3 inline-block h-3 w-3 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-orange-500' : 'bg-yellow-400'}`} />{alert.type}</td>
                    <td className="py-3 font-bold text-content-primary">{alert.reference}</td>
                    <td className="py-3 text-content-muted">{alert.commune}</td>
                    <td className="py-3 text-right font-bold text-orange-600">{alert.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {model.kpis.map((kpi) => (
          <div key={kpi.label} className={`${logisticsCard} p-5`}>
            <div className="flex items-center gap-4">
              <span className={`flex h-14 w-14 items-center justify-center rounded-full ${kpi.tone}`}>
                <Icon name={kpi.icon} className="h-7 w-7" />
              </span>
              <div>
                <p className="text-sm font-semibold text-content-muted">{kpi.label}</p>
                <p className="text-3xl font-extrabold text-content-primary">{kpi.value}</p>
                <p className="text-xs font-bold text-green-700">{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Missions / Jour</h3>
          <div className="mt-4 h-48"><MiniLineChart data={model.missionTrend} color="#2563EB" /></div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Livraisons / Commune</h3>
          <div className="mt-5"><HorizontalBars data={model.communeDeliveries} color="#F97316" /></div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Revenus quotidiens ($)</h3>
          <div className="mt-4 h-48"><MiniLineChart data={model.revenueTrend} color="#10B981" /></div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Performances par zone</h3>
          <div className="mt-4 space-y-3">
            {model.zonePerformance.length === 0 ? <p className="text-sm text-content-muted">Aucune zone backend disponible.</p> : model.zonePerformance.map((zone) => (
              <div key={zone.commune} className="grid grid-cols-[1fr_56px_24px] items-center gap-2 text-sm">
                <span className="font-bold text-content-primary">{zone.commune}</span>
                <span className="font-extrabold text-content-primary">{zone.successRate}%</span>
                <span className={zone.successRate >= 90 ? 'text-green-600' : zone.successRate >= 75 ? 'text-orange-600' : 'text-red-600'}>{zone.successRate >= 90 ? '↑' : '↓'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Top partenaires</h3>
          <div className="mt-4 space-y-3">
            {model.topPartners.length === 0 ? <p className="text-sm text-content-muted">Aucun classement backend disponible.</p> : model.topPartners.map((partner) => (
              <div key={partner.name} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0">
                <span className="truncate text-sm font-bold text-content-primary">{partner.name}</span>
                <span className="text-sm font-extrabold text-orange-500">{toNumber(partner.rating).toFixed(1)} ★</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-content-primary">Chauffeurs actifs</h3>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{model.activeDrivers.available} disponibles</span>
          </div>
          <CircularGauge value={model.activeDrivers.percent} label={`${model.activeDrivers.active} / ${model.activeDrivers.total} actifs`} />
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Véhicules</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ['Disponibles', model.fleet.available, 'text-green-600'],
              ['En mission', model.fleet.inMission, 'text-brand-blue'],
              ['En maintenance', model.fleet.maintenance, 'text-orange-600'],
              ['Hors service', model.fleet.out, 'text-red-600'],
              ['Total', model.fleet.total, 'text-content-primary'],
            ].map(([label, value, tone]) => (
              <div key={label} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                <span className="font-semibold text-content-muted">{label}</span>
                <span className={`font-extrabold ${tone}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Truth Health</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {model.health.map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-content-primary">{item.label}</span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-extrabold ${item.status === 'SAIN' ? 'bg-green-50 text-green-700' : item.status === 'ATTENTION' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>{item.status}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-content-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-base font-extrabold text-content-primary">Activity feed temps réel</h3>
          <div className="mt-4 space-y-3">
            {model.activityFeed.length === 0 ? <p className="rounded-2xl bg-surface-muted p-4 text-sm text-content-muted">Aucun événement backend récent.</p> : model.activityFeed.map((event) => (
              <div key={`${event.reference}-${event.time}`} className="flex items-start gap-3 rounded-2xl bg-surface-muted p-3">
                <span className={`mt-1 h-3 w-3 rounded-full ${event.severity === 'critical' ? 'bg-red-500' : event.severity === 'warning' ? 'bg-orange-500' : 'bg-brand-blue'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-content-primary">{event.label}</p>
                  <p className="text-xs text-content-muted">{event.reference} · {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${logisticsCard} p-5`}>
        <h3 className="text-base font-extrabold text-content-primary">Actions rapides</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ['Voir anomalies', 'alerts'],
            ['Voir commandes bloquées', 'missions'],
            ['Voir tickets ouverts', 'support'],
            ['Voir paiements échoués', 'reports'],
            ['Voir chauffeurs indisponibles', 'drivers'],
            ['Exporter rapport', 'reports'],
          ].map(([label, target]) => (
            <button key={label} type="button" onClick={() => triggerAction(label, target)} className="min-h-12 rounded-2xl border border-gray-200 px-4 text-sm font-extrabold text-content-primary transition hover:border-brand-blue/40 hover:bg-blue-50">
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LogisticsPerformance;
