import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icon';
import useActivityLogCenter from '../hooks/useActivityLogCenter';
import { EventDetailDrawer } from '../components/admin/activity-log/EventDetailDrawer';
import { trackActivityLogEvent } from '../lib/admin/activity-log-api';
import type { ActivityLogEvent } from '../lib/admin/activity-log-types';

const LOGS_PER_PAGE = 10;
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const SEV_BADGE: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-100', major: 'bg-orange-50 text-orange-700 border-orange-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100', low: 'bg-blue-50 text-blue-700 border-blue-100', info: 'bg-slate-100 text-slate-700 border-slate-200',
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const rel = (d?: string) => {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.floor(h / 24)} j`;
};

function KpiCard({ label, value, change, icon, color }: { label: string; value: number; change: string; icon: React.ComponentProps<typeof Icon>['name']; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold">{fmt(value)}</p>
          <p className="text-xs text-emerald-600 font-semibold">{change}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon name={icon} className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export const ActivityLogControlCenter: React.FC = () => {
  const {
    kpis, events, liveEvents, heatmap, topActivities, corridorHealth,
    actorDistribution, severityDistribution, loading, error, refresh,
  } = useActivityLogCenter();

  const [search, setSearch] = useState('');
  const [actor, setActor] = useState('all');
  const [corridor, setCorridor] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ActivityLogEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackActivityLogEvent('activity_log_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const corridors = useMemo(() => Array.from(new Set(events.map((e) => e.corridorLabel))).sort(), [events]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) => {
      if (q && !`${e.actorName} ${e.reference} ${e.description} ${e.eventId}`.toLowerCase().includes(q)) return false;
      if (actor !== 'all' && e.actorType !== actor) return false;
      if (corridor !== 'all' && e.corridorLabel !== corridor) return false;
      if (severity !== 'all' && e.severity !== severity) return false;
      return true;
    });
  }, [events, search, actor, corridor, severity]);

  const paginated = filtered.slice((page - 1) * LOGS_PER_PAGE, page * LOGS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / LOGS_PER_PAGE));

  const heatmapCells = useMemo(() => {
    const max = Math.max(1, ...heatmap.map((c) => c.count));
    return heatmap.map((c) => ({ ...c, intensity: c.count / max }));
  }, [heatmap]);

  const navigateTo = (section: string) => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: section }));

  if (loading) return <div className="space-y-4"><div className="h-28 bg-white rounded-2xl border animate-pulse" /><div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" />)}</div></div>;
  if (error) return (
    <div className="flex justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <p className="mb-4">{error}</p>
        <button type="button" onClick={() => refresh()} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="document-text" className="w-6 h-6 text-blue-600" /> Journal admin</h1>
            <p className="text-sm text-gray-500">Marketplace · Logistique · Vérité opérationnelle en temps réel</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher utilisateur, action, IP..." className="border rounded-xl px-3 py-2 text-sm w-72" />
            <button type="button" onClick={() => refresh()} className="px-3 py-2 border rounded-xl text-sm">Actualiser</button>
            <button type="button" onClick={() => setToast('Export CSV lancé')} className="px-3 py-2 border rounded-xl text-sm">Exporter</button>
          </div>
        </div>
      </div>

      {kpis && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <KpiCard label="Activités totales" value={kpis.totalActivities} change={`+${kpis.totalChange}% vs hier`} icon="document-text" color="bg-blue-50 text-blue-700" />
          <KpiCard label="Admins" value={kpis.adminActivities} change={`+${kpis.adminChange}%`} icon="user" color="bg-purple-50 text-purple-700" />
          <KpiCard label="Partenaires" value={kpis.partnerActivities} change={`+${kpis.partnerChange}%`} icon="building" color="bg-emerald-50 text-emerald-700" />
          <KpiCard label="Chauffeurs" value={kpis.driverActivities} change={`+${kpis.driverChange}%`} icon="truck" color="bg-orange-50 text-orange-700" />
          <KpiCard label="Système" value={kpis.systemActivities} change={`${kpis.systemChange}%`} icon="computer" color="bg-slate-100 text-slate-700" />
          <KpiCard label="Anomalies" value={kpis.anomalies} change={`${kpis.anomaliesChange}%`} icon="warning" color="bg-red-50 text-red-700" />
        </section>
      )}

      <section className="rounded-2xl border bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <select value={actor} onChange={(e) => { setActor(e.target.value); setPage(1); }} className="rounded-xl border px-3 py-2 text-sm">
          <option value="all">Tous les acteurs</option>
          <option value="admin">Admin</option><option value="partner">Partenaire</option><option value="driver">Chauffeur</option><option value="client">Client</option><option value="system">Système</option>
        </select>
        <select value={corridor} onChange={(e) => { setCorridor(e.target.value); setPage(1); }} className="rounded-xl border px-3 py-2 text-sm">
          <option value="all">Tous les corridors</option>
          {corridors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} className="rounded-xl border px-3 py-2 text-sm">
          <option value="all">Toutes gravités</option>
          <option value="critical">Critique</option><option value="major">Majeure</option><option value="medium">Moyenne</option><option value="low">Faible</option><option value="info">Info</option>
        </select>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)] gap-5">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex justify-between items-center border-b p-5">
            <div><h2 className="text-lg font-bold">Activity Timeline</h2><p className="text-sm text-slate-500">Qui a fait quoi, quand, sur quoi et avec quel impact.</p></div>
            <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full"><span className="h-2 w-2 rounded-full bg-emerald-500" /> En temps réel</span>
          </div>
          <div className="divide-y">
            {paginated.map((e) => (
              <article key={e.id} className="p-5 hover:bg-slate-50 grid grid-cols-[90px_minmax(0,1fr)_auto] gap-4">
                <div className="text-right text-sm">
                  <p className="font-bold">{e.occurredAt ? new Date(e.occurredAt).toLocaleTimeString('fr-FR') : '—'}</p>
                  <p className="text-xs text-slate-500">{rel(e.occurredAt)}</p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <h3 className="font-bold">{e.actionLabel || e.action}</h3>
                    <span className="text-xs border rounded-full px-2 py-0.5">{e.corridorLabel}</span>
                    <span className={`text-xs border rounded-full px-2 py-0.5 ${SEV_BADGE[e.severity] || ''}`}>{e.severityLabel}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{e.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{e.actorTypeLabel}: <strong>{e.actorName}</strong> · Impact: {e.impact || '—'}{e.ipAddress ? ` · IP ${e.ipAddress}` : ''}</p>
                  <p className="text-xs text-slate-400">Réf: {e.reference} · {e.statusLabel}</p>
                </div>
                <button type="button" onClick={() => setSelected(e)} className="self-center px-3 py-2 text-sm font-bold text-blue-700 bg-blue-50 rounded-xl border border-blue-100">Voir détails</button>
              </article>
            ))}
          </div>
          <div className="flex justify-between items-center border-t p-5 text-sm text-slate-500">
            <span>Affichage {(page - 1) * LOGS_PER_PAGE + 1} à {Math.min(page * LOGS_PER_PAGE, filtered.length)} sur {fmt(filtered.length)}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">Précédent</button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">{page}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">Suivant</button>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold">Activité plateforme</h2>
            <div className="mt-4 grid grid-cols-[28px_repeat(24,1fr)] gap-0.5 text-[9px]">
              <span />
              {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center text-slate-400">{h % 6 === 0 ? `${String(h).padStart(2, '0')}h` : ''}</span>)}
              {DAY_LABELS.map((day, di) => (
                <React.Fragment key={day}>
                  <span className="text-right pr-1 text-slate-500 font-semibold">{day}</span>
                  {heatmapCells.filter((c) => c.day === di).sort((a, b) => a.hour - b.hour).map((cell) => (
                    <span key={`${di}-${cell.hour}`} title={`${cell.count} activité(s)`} className="aspect-square rounded-[2px]" style={{ backgroundColor: `rgba(37,99,235,${0.1 + cell.intensity * 0.8})` }} />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold mb-4">En temps réel</h2>
            <div className="space-y-3">
              {liveEvents.map((e) => (
                <div key={e.id} className="text-sm">
                  <p className="text-xs text-slate-500">{rel(e.occurredAt)}</p>
                  <p className="font-bold">{e.actionLabel || e.action}</p>
                  <p className="text-xs text-slate-500">{e.actorName} · {e.reference}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold mb-4">Top activités</h2>
            {topActivities.map((a) => (
              <div key={a.label} className="mb-3">
                <div className="flex justify-between text-sm"><span>{a.label}</span><strong>{fmt(a.count)}</strong></div>
                <div className="h-2 bg-slate-100 rounded-full mt-1"><span className="block h-2 rounded-full" style={{ width: `${Math.max(4, a.percent)}%`, backgroundColor: a.color }} /></div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold mb-4">Corridors de vérité</h2>
            {corridorHealth.map((c) => (
              <div key={c.corridor} className="flex justify-between items-center py-2 border-b last:border-0">
                <div><p className="font-semibold text-sm">{c.corridorLabel}</p><p className="text-xs text-slate-500">{c.events} événements · Cohérence: {c.coherenceLabel}</p></div>
                <span className={`text-xs px-2 py-1 rounded-full ${c.coherence === 'excellent' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>{c.coherenceLabel}</span>
              </div>
            ))}
            <button type="button" onClick={() => navigateTo('Truth Dashboard')} className="mt-3 w-full py-2 text-sm font-bold text-blue-700 bg-blue-50 rounded-xl">Voir détails des corridors</button>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold mb-3">Répartition par utilisateur</h2>
          {actorDistribution.map((a) => (
            <div key={a.actorType} className="flex justify-between text-sm py-1"><span>{a.actorLabel}</span><span className="font-bold">{fmt(a.count)} ({a.percent}%)</span></div>
          ))}
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold mb-3">Événements par gravité</h2>
          {severityDistribution.map((s) => (
            <div key={s.severity} className="flex justify-between text-sm py-1"><span className={`px-2 py-0.5 rounded-full text-xs ${SEV_BADGE[s.severity]}`}>{s.severityLabel}</span><strong>{fmt(s.count)}</strong></div>
          ))}
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="font-bold mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Rechercher', fn: () => setSearch('') },
              { label: 'Anomalies', fn: () => { setSeverity('critical'); navigateTo('Anomalies'); } },
              { label: 'Investigation', fn: () => navigateTo('Investigate') },
              { label: 'Order Truth', fn: () => navigateTo('Order Truth') },
              { label: 'Exporter', fn: () => setToast('Export lancé') },
              { label: 'Logs système', fn: () => refresh() },
            ].map((a) => (
              <button key={a.label} type="button" onClick={a.fn} className="rounded-xl border px-3 py-3 text-sm font-bold hover:bg-slate-50">{a.label}</button>
            ))}
          </div>
        </div>
      </section>

      <EventDetailDrawer event={selected} onClose={() => setSelected(null)} />
      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm z-50">{toast}</div>}
    </div>
  );
};
