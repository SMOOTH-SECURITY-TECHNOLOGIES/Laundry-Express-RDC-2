import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useAppContext } from '../../context/AppContext';
import { AdminActivityLog, AdminUserSummary, realApi } from '../../services/real-api';

const LOGS_PER_PAGE = 10;

type ActivityCategory = 'order' | 'payment' | 'logistics' | 'truth' | 'anomaly' | 'admin' | 'system';
type Severity = 'critical' | 'major' | 'medium' | 'low' | 'info';
type ActorFilter = 'all' | 'admin' | 'partner' | 'driver' | 'client' | 'system';

interface ActivityEvent {
  log: AdminActivityLog;
  category: ActivityCategory;
  severity: Severity;
  actorType: Exclude<ActorFilter, 'all'>;
  title: string;
  description: string;
  reference: string;
  corridor: string;
  impact: string;
  actionLabel: string;
  targetSection: string;
}

const CATEGORY_META: Record<ActivityCategory, { label: string; icon: React.ComponentProps<typeof Icon>['name']; dot: string; badge: string; soft: string }> = {
  order: {
    label: 'Commande',
    icon: 'shoppingBag',
    dot: 'bg-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
    soft: 'bg-blue-50 text-blue-700',
  },
  payment: {
    label: 'Paiement',
    icon: 'currencyDollar',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  logistics: {
    label: 'Logistique',
    icon: 'truck',
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-100',
    soft: 'bg-orange-50 text-orange-700',
  },
  truth: {
    label: 'Vérité',
    icon: 'shield-check',
    dot: 'bg-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-100',
    soft: 'bg-purple-50 text-purple-700',
  },
  anomaly: {
    label: 'Anomalie',
    icon: 'warning',
    dot: 'bg-red-600',
    badge: 'bg-red-50 text-red-700 border-red-100',
    soft: 'bg-red-50 text-red-700',
  },
  admin: {
    label: 'Admin',
    icon: 'user',
    dot: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    soft: 'bg-slate-100 text-slate-700',
  },
  system: {
    label: 'Système',
    icon: 'computer',
    dot: 'bg-slate-600',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    soft: 'bg-slate-100 text-slate-700',
  },
};

const SEVERITY_META: Record<Severity, { label: string; badge: string; weight: number }> = {
  critical: { label: 'Critique', badge: 'bg-red-50 text-red-700 border-red-100', weight: 5 },
  major: { label: 'Majeure', badge: 'bg-orange-50 text-orange-700 border-orange-100', weight: 4 },
  medium: { label: 'Moyenne', badge: 'bg-amber-50 text-amber-700 border-amber-100', weight: 3 },
  low: { label: 'Faible', badge: 'bg-blue-50 text-blue-700 border-blue-100', weight: 2 },
  info: { label: 'Info', badge: 'bg-slate-100 text-slate-700 border-slate-200', weight: 1 },
};

const normalize = (value?: string | null) => (value || '').toLowerCase();

const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(value);

const getRelativeTime = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
};

const getReference = (log: AdminActivityLog, category: ActivityCategory) => {
  if (log.resource_id) return log.resource_id;
  const text = `${log.details || ''} ${log.resource_type || ''} ${log.id}`;
  const explicit = text.match(/\b(ORD|PAY|DRV|ANOM|INV|SYS|PAR)-?[A-Z0-9-]+\b/i)?.[0];
  if (explicit) return explicit.toUpperCase();
  const prefixes: Record<ActivityCategory, string> = {
    order: 'ORD',
    payment: 'PAY',
    logistics: 'DRV',
    truth: 'TRUTH',
    anomaly: 'ANOM',
    admin: 'ADM',
    system: 'SYS',
  };
  return `${prefixes[category]}-${log.id.slice(0, 6).toUpperCase()}`;
};

const classifyCategory = (log: AdminActivityLog): ActivityCategory => {
  const haystack = normalize(`${log.action} ${log.resource_type} ${log.details}`);
  if (haystack.includes('anomal') || haystack.includes('violation') || haystack.includes('litige') || haystack.includes('refund')) return 'anomaly';
  if (haystack.includes('truth') || haystack.includes('audit') || haystack.includes('investigation') || haystack.includes('preuve')) return 'truth';
  if (haystack.includes('payment') || haystack.includes('paiement') || haystack.includes('commission') || haystack.includes('invoice')) return 'payment';
  if (haystack.includes('driver') || haystack.includes('chauffeur') || haystack.includes('delivery') || haystack.includes('mission') || haystack.includes('pickup') || haystack.includes('logistic')) return 'logistics';
  if (haystack.includes('order') || haystack.includes('commande')) return 'order';
  if (haystack.includes('system') || haystack.includes('webhook') || haystack.includes('backup') || haystack.includes('worker')) return 'system';
  return 'admin';
};

const classifySeverity = (log: AdminActivityLog, category: ActivityCategory): Severity => {
  const haystack = normalize(`${log.action} ${log.resource_type} ${log.details}`);
  if (haystack.includes('critical') || haystack.includes('critique') || haystack.includes('failed') || haystack.includes('error')) return 'critical';
  if (category === 'anomaly') return 'major';
  if (haystack.includes('warning') || haystack.includes('sla') || haystack.includes('late') || haystack.includes('retard')) return 'medium';
  if (haystack.includes('read') || haystack.includes('view')) return 'info';
  return 'low';
};

const classifyActor = (log: AdminActivityLog): ActivityEvent['actorType'] => {
  const haystack = normalize(`${log.user_name} ${log.resource_type} ${log.details}`);
  if (haystack.includes('driver') || haystack.includes('chauffeur')) return 'driver';
  if (haystack.includes('partner') || haystack.includes('partenaire') || haystack.includes('pressing')) return 'partner';
  if (haystack.includes('client') || haystack.includes('customer')) return 'client';
  if (haystack.includes('system') || haystack.includes('worker') || haystack.includes('webhook')) return 'system';
  return 'admin';
};

const buildTitle = (log: AdminActivityLog, category: ActivityCategory) => {
  const action = normalize(log.action);
  const resource = normalize(log.resource_type);
  if (category === 'order') return action.includes('create') ? 'Commande créée' : 'Commande mise à jour';
  if (category === 'payment') return action.includes('refund') ? 'Remboursement traité' : 'Paiement confirmé';
  if (category === 'logistics') return resource.includes('mission') || action.includes('assign') ? 'Mission assignée' : 'Activité logistique';
  if (category === 'truth') return resource.includes('investigation') ? 'Investigation mise à jour' : 'Vérité opérationnelle validée';
  if (category === 'anomaly') return 'Anomalie détectée';
  if (category === 'system') return 'Événement système';
  if (action === 'read' && resource === 'admin_activity_logs') return 'Consultation du journal d’activité';
  return `${log.action.replace(/_/g, ' ')} · ${log.resource_type.replace(/_/g, ' ')}`;
};

const buildActivityEvent = (log: AdminActivityLog): ActivityEvent => {
  const category = classifyCategory(log);
  const severity = classifySeverity(log, category);
  const reference = getReference(log, category);
  const corridor = category === 'admin' || category === 'system' ? 'Plateforme' : CATEGORY_META[category].label;
  const actorType = classifyActor(log);
  const targetSection =
    category === 'truth' ? 'Order Truth' : category === 'anomaly' ? 'Anomalies' : category === 'logistics' ? 'Cockpit Dispatcher' : category === 'payment' ? 'Paiements' : 'Order Truth';

  return {
    log,
    category,
    severity,
    actorType,
    title: buildTitle(log, category),
    description: log.details || `${log.user_name} a effectué ${log.action} sur ${log.resource_type}.`,
    reference,
    corridor,
    impact: severity === 'critical' || severity === 'major' ? 'Action requise' : category === 'admin' ? 'Traçabilité' : 'Suivi opérationnel',
    actionLabel:
      category === 'truth' ? 'Voir Truth' : category === 'anomaly' ? 'Voir Anomalie' : category === 'payment' ? 'Voir Paiement' : category === 'logistics' ? 'Voir Mission' : 'Voir Détails',
    targetSection,
  };
};

const groupCount = <T extends string>(events: ActivityEvent[], getter: (event: ActivityEvent) => T) => {
  return events.reduce<Record<T, number>>((acc, event) => {
    const key = getter(event);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<T, number>);
};

const pct = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

export const ActivityLogManagement: React.FC = () => {
  const { t, addNotification } = useAppContext();
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    query: '',
    userId: 'all',
    actor: 'all' as ActorFilter,
    type: 'all' as ActivityCategory | 'all',
    corridor: 'all',
    severity: 'all' as Severity | 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const loadActivity = () => {
    setIsLoading(true);
    Promise.all([realApi.getAdminActivityLogs(500), realApi.getAdminUsers(300)])
      .then(([activityResponse, userResponse]) => {
        const activityLogs = activityResponse.logs || [];
        setLogs([...activityLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setUsers(userResponse || []);
      })
      .catch(() => {
        setLogs([]);
        setUsers([]);
        addNotification(
          t('activityLog.loadError', {
            default: 'Impossible de charger les journaux d’activité backend.',
          }),
          'error'
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([realApi.getAdminActivityLogs(500), realApi.getAdminUsers(300)])
      .then(([activityResponse, userResponse]) => {
        if (!isMounted) return;
        const activityLogs = activityResponse.logs || [];
        setLogs([...activityLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setUsers(userResponse || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setLogs([]);
        setUsers([]);
        addNotification(
          t('activityLog.loadError', {
            default: 'Impossible de charger les journaux d’activité backend.',
          }),
          'error'
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [addNotification, t]);

  const events = useMemo(() => logs.map(buildActivityEvent), [logs]);
  const categoryCounts = useMemo(() => groupCount(events, (event) => event.category), [events]);
  const actorCounts = useMemo(() => groupCount(events, (event) => event.actorType), [events]);
  const severityCounts = useMemo(() => groupCount(events, (event) => event.severity), [events]);

  const availableCorridors = useMemo(() => Array.from(new Set(events.map((event) => event.corridor))).sort(), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const queryLower = normalize(filters.query);
      const matchesQuery =
        !queryLower ||
        normalize(event.title).includes(queryLower) ||
        normalize(event.description).includes(queryLower) ||
        normalize(event.reference).includes(queryLower) ||
        normalize(event.log.user_name).includes(queryLower) ||
        normalize(event.log.resource_type).includes(queryLower) ||
        normalize(event.log.id).includes(queryLower);

      const matchesUser = filters.userId === 'all' || event.log.user_id === filters.userId;
      const matchesActor = filters.actor === 'all' || event.actorType === filters.actor;
      const matchesType = filters.type === 'all' || event.category === filters.type;
      const matchesCorridor = filters.corridor === 'all' || event.corridor === filters.corridor;
      const matchesSeverity = filters.severity === 'all' || event.severity === filters.severity;

      return matchesQuery && matchesUser && matchesActor && matchesType && matchesCorridor && matchesSeverity;
    });
  }, [events, filters]);

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + LOGS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / LOGS_PER_PAGE));
  const liveEvents = events.slice(0, 5);

  const topActivities = useMemo(() => {
    return [
      { label: 'Commandes créées', value: categoryCounts.order || 0, color: 'bg-blue-600' },
      { label: 'Paiements confirmés', value: categoryCounts.payment || 0, color: 'bg-emerald-600' },
      { label: 'Événements logistiques', value: categoryCounts.logistics || 0, color: 'bg-orange-500' },
      { label: 'Validations Truth', value: categoryCounts.truth || 0, color: 'bg-purple-600' },
      { label: 'Anomalies détectées', value: categoryCounts.anomaly || 0, color: 'bg-red-600' },
      { label: 'Activité système', value: categoryCounts.system || 0, color: 'bg-slate-500' },
    ].sort((a, b) => b.value - a.value);
  }, [categoryCounts]);

  const heatmapCells = useMemo(() => {
    const buckets = Array.from({ length: 7 * 24 }, (_, index) => {
      const day = Math.floor(index / 24);
      const hour = index % 24;
      return { day, hour, count: 0 };
    });

    events.forEach((event) => {
      const date = new Date(event.log.created_at);
      const day = (date.getDay() + 6) % 7;
      const hour = date.getHours();
      buckets[day * 24 + hour].count += 1;
    });

    const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
    return buckets.map((bucket) => ({
      ...bucket,
      intensity: bucket.count / max,
    }));
  }, [events]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const navigateTo = (section: string, message?: string) => {
    if (message) {
      window.dispatchEvent(new CustomEvent('admin-action-message', { detail: message }));
    }
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: section }));
  };

  const StatCard = ({
    label,
    value,
    icon,
    color,
    trend,
  }: {
    label: string;
    value: number;
    icon: React.ComponentProps<typeof Icon>['name'];
    color: string;
    trend: string;
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(value)}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-600">{trend}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-end gap-1">
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="h-6 flex-1 rounded-t bg-current opacity-80"
            style={{ height: `${10 + ((index * 7 + value) % 22)}px`, color: color.includes('red') ? '#ef4444' : color.includes('orange') ? '#f97316' : color.includes('green') || color.includes('emerald') ? '#10b981' : color.includes('purple') ? '#8b5cf6' : '#2563eb' }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Activités totales" value={events.length} icon="document-text" color="bg-blue-50 text-blue-700" trend="+ flux backend réel" />
        <StatCard label="Admins" value={actorCounts.admin || 0} icon="user" color="bg-purple-50 text-purple-700" trend="traçabilité interne" />
        <StatCard label="Partenaires" value={actorCounts.partner || 0} icon="building" color="bg-emerald-50 text-emerald-700" trend="activité réseau" />
        <StatCard label="Chauffeurs" value={actorCounts.driver || 0} icon="truck" color="bg-orange-50 text-orange-700" trend="missions terrain" />
        <StatCard label="Système" value={(actorCounts.system || 0) + (categoryCounts.system || 0)} icon="computer" color="bg-slate-100 text-slate-700" trend="automations" />
        <StatCard label="Anomalies" value={categoryCounts.anomaly || 0} icon="warning" color="bg-red-50 text-red-700" trend={`${severityCounts.critical || 0} critique(s)`} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Utilisateur</span>
            <select name="userId" value={filters.userId} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tous les utilisateurs</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Acteur</span>
            <select name="actor" value={filters.actor} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tous</option>
              <option value="admin">Admin</option>
              <option value="partner">Partenaire</option>
              <option value="driver">Chauffeur</option>
              <option value="client">Client</option>
              <option value="system">Système</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Type</span>
            <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tous les types</option>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Corridor</span>
            <select name="corridor" value={filters.corridor} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tous les corridors</option>
              {availableCorridors.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Gravité</span>
            <select name="severity" value={filters.severity} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Toutes</option>
              {Object.entries(SEVERITY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Recherche universelle</span>
            <input
              name="query"
              value={filters.query}
              onChange={handleFilterChange}
              placeholder="ORD-7845, PAY-442, Jean K..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Activity Timeline</h2>
              <p className="text-sm text-slate-500">Qui a fait quoi, quand, sur quoi et avec quel impact.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              En temps réel
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : paginatedEvents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {paginatedEvents.map((event) => {
                const categoryMeta = CATEGORY_META[event.category];
                const severityMeta = SEVERITY_META[event.severity];
                return (
                  <article key={event.log.id} className="grid grid-cols-[92px_40px_minmax(0,1fr)] gap-4 p-5 transition-colors hover:bg-slate-50">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{new Date(event.log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      <p className="text-xs text-slate-500">{getRelativeTime(event.log.created_at)}</p>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="absolute bottom-[-20px] top-10 w-px bg-slate-200" />
                      <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-white ${categoryMeta.dot}`}>
                        <Icon name={categoryMeta.icon} className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px_150px] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{event.title}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${categoryMeta.badge}`}>{categoryMeta.label}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${severityMeta.badge}`}>{severityMeta.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Acteur : <span className="font-semibold text-slate-700">{event.log.user_name}</span> · Impact : {event.impact}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Référence</p>
                        <p className="text-sm font-bold text-slate-900">{event.reference}</p>
                        <p className="text-xs text-slate-500">{event.corridor}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo(event.targetSection, `Contexte ${event.reference} ouvert depuis Activity Center.`)}
                        className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
                      >
                        {event.actionLabel}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500">{t('activityLog.noLogsFound', { default: 'Aucune activité trouvée.' })}</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5">
            <p className="text-sm text-slate-500">
              Affichage {filteredEvents.length === 0 ? 0 : (currentPage - 1) * LOGS_PER_PAGE + 1} à {Math.min(currentPage * LOGS_PER_PAGE, filteredEvents.length)} sur {formatNumber(filteredEvents.length)} activités
            </p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">
                Précédent
              </button>
              <span className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">{currentPage}</span>
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">
                Suivant
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">Activité plateforme</h2>
              <span className="text-xs font-semibold text-slate-500">7j x 24h</span>
            </div>
            <div className="mt-4 grid grid-cols-[32px_repeat(24,minmax(0,1fr))] gap-1 text-[10px] text-slate-400">
              <span />
              {['00h', '', '', '', '', '', '06h', '', '', '', '', '', '12h', '', '', '', '', '', '18h', '', '', '', '', ''].map((hour, index) => (
                <span key={`${hour}-${index}`} className="text-center">{hour}</span>
              ))}
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, dayIndex) => (
                <React.Fragment key={day}>
                  <span className="pr-1 text-right font-semibold text-slate-500">{day}</span>
                  {heatmapCells.slice(dayIndex * 24, dayIndex * 24 + 24).map((cell) => (
                    <span
                      key={`${day}-${cell.hour}`}
                      title={`${day} ${cell.hour}h : ${cell.count} activité(s)`}
                      className="aspect-square rounded-[3px] border border-blue-100"
                      style={{ backgroundColor: `rgba(37, 99, 235, ${0.12 + cell.intensity * 0.78})` }}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
              Faible activité
              <span className="h-2 w-20 rounded-full bg-gradient-to-r from-blue-100 to-blue-600" />
              Forte activité
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">En temps réel</h2>
              <button type="button" onClick={loadActivity} className="text-sm font-bold text-blue-700 hover:text-blue-800">
                Actualiser
              </button>
            </div>
            <div className="space-y-4">
              {liveEvents.map((event) => {
                const meta = CATEGORY_META[event.category];
                return (
                  <div key={`live-${event.log.id}`} className="flex gap-3">
                    <span className={`mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-xl text-white ${meta.dot}`}>
                      <Icon name={meta.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">{getRelativeTime(event.log.created_at)}</p>
                      <p className="text-sm font-bold text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-500">{event.reference}</p>
                    </div>
                  </div>
                );
              })}
              {liveEvents.length === 0 && <p className="text-sm text-slate-500">Aucun flux récent.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Top activités</h2>
            <div className="mt-4 space-y-3">
              {topActivities.map((activity) => (
                <div key={activity.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{activity.label}</span>
                    <span className="font-bold text-slate-950">{formatNumber(activity.value)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <span className={`block h-2 rounded-full ${activity.color}`} style={{ width: `${Math.max(4, pct(activity.value, Math.max(1, events.length)))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Corridors de vérité</h2>
            <div className="mt-4 space-y-3">
              {(['order', 'payment', 'logistics', 'truth'] as ActivityCategory[]).map((category) => {
                const meta = CATEGORY_META[category];
                const count = categoryCounts[category] || 0;
                const anomalies = events.filter((event) => event.category === category && ['critical', 'major'].includes(event.severity)).length;
                const status = anomalies > 5 ? 'Critique' : anomalies > 0 ? 'Dégradé' : 'Sain';
                const statusClass = status === 'Critique' ? 'bg-red-50 text-red-700' : status === 'Dégradé' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700';
                return (
                  <div key={category} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.soft}`}>
                        <Icon name={meta.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{meta.label}</p>
                        <p className="text-xs text-slate-500">{formatNumber(count)} événements · {anomalies} anomalie(s)</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass}`}>{status}</span>
                  </div>
                );
              })}
              <button type="button" onClick={() => navigateTo('Truth Dashboard')} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100">
                Voir détails des corridors
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Timeline par corridor</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(CATEGORY_META).map(([category, meta]) => {
              const value = categoryCounts[category as ActivityCategory] || 0;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{meta.label}</span>
                    <span className="text-slate-500">{formatNumber(value)} · {pct(value, events.length)}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <span className={`${meta.dot} block h-2 rounded-full`} style={{ width: `${Math.max(3, pct(value, Math.max(1, events.length)))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Répartition par utilisateur</h2>
          <div className="mt-4 space-y-3">
            {(['admin', 'partner', 'driver', 'client', 'system'] as Exclude<ActorFilter, 'all'>[]).map((actor) => (
              <div key={actor} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600">{actor === 'driver' ? 'chauffeurs' : actor === 'partner' ? 'partenaires' : actor === 'system' ? 'système' : actor}</span>
                <span className="font-bold text-slate-950">{formatNumber(actorCounts[actor] || 0)} <span className="font-normal text-slate-400">({pct(actorCounts[actor] || 0, events.length)}%)</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Événements par gravité</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(SEVERITY_META)
              .sort((a, b) => b[1].weight - a[1].weight)
              .map(([severity, meta]) => (
                <div key={severity} className="flex items-center justify-between text-sm">
                  <span className={`rounded-full border px-2 py-1 text-xs font-bold ${meta.badge}`}>{meta.label}</span>
                  <span className="font-bold text-slate-950">{formatNumber(severityCounts[severity as Severity] || 0)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Actions rapides</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setFilters((prev) => ({ ...prev, query: '' }))} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100">
              Rechercher
            </button>
            <button type="button" onClick={() => navigateTo('Anomalies')} className="rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-bold text-red-700 hover:bg-red-100">
              Anomalies
            </button>
            <button type="button" onClick={() => navigateTo('Investigate')} className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-3 text-sm font-bold text-purple-700 hover:bg-purple-100">
              Investigation
            </button>
            <button type="button" onClick={() => navigateTo('Order Truth')} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
              Order Truth
            </button>
            <button type="button" onClick={() => addNotification('Export du rapport Activity Center préparé.', 'success')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
              Exporter
            </button>
            <button type="button" onClick={loadActivity} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Logs système
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
