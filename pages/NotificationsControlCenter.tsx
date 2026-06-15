import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useNotificationsCenter from '../hooks/useNotificationsCenter';
import { NotificationsHeader } from '../components/admin/notifications/NotificationsHeader';
import { NotificationsFilters } from '../components/admin/notifications/NotificationsFilters';
import { NotificationsTabs } from '../components/admin/notifications/NotificationsTabs';
import { NotificationKpiCards } from '../components/admin/notifications/NotificationKpiCards';
import { NotificationsTable } from '../components/admin/notifications/NotificationsTable';
import { ChannelDistributionDonut } from '../components/admin/notifications/ChannelDistributionDonut';
import { DeliveryStatusDonut } from '../components/admin/notifications/DeliveryStatusDonut';
import { TopEventsTable } from '../components/admin/notifications/TopEventsTable';
import { ChannelPerformanceCard } from '../components/admin/notifications/ChannelPerformanceCard';
import { PopularTemplatesTable } from '../components/admin/notifications/PopularTemplatesTable';
import { AutomationsTable } from '../components/admin/notifications/AutomationsTable';
import { RecentNotificationActivity } from '../components/admin/notifications/RecentNotificationActivity';
import { NotificationQuickActions } from '../components/admin/notifications/NotificationQuickActions';
import { NotificationBuilderModal } from '../components/admin/notifications/NotificationBuilderModal';
import { TemplateCenter } from '../components/admin/notifications/TemplateCenter';
import { DeliveryHealthPanel } from '../components/admin/notifications/DeliveryHealthPanel';
import { NotificationErrorCenter } from '../components/admin/notifications/NotificationErrorCenter';
import { UnsubscribeCenter } from '../components/admin/notifications/UnsubscribeCenter';
import { SegmentCenter } from '../components/admin/notifications/SegmentCenter';
import { TemplateEditorDrawer } from '../components/admin/notifications/TemplateEditorDrawer';
import { trackNotificationEvent } from '../lib/admin/notifications-api';
import type { NotificationItem, NotificationTemplate } from '../lib/admin/notifications-types';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div>
      <div className="h-64 bg-white rounded-2xl border animate-pulse" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les notifications.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const NotificationsControlCenter: React.FC = () => {
  const {
    kpis, notifications, channelDistribution, deliveryStatus, topEvents, channelPerformance,
    popularTemplates, automations, activities, providerHealth, errors, unsubscribes, segments, templates,
    loading, error, refresh, handleSend, handleRetry, handleExport,
  } = useNotificationsCenter();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editTemplate, setEditTemplate] = useState<NotificationTemplate | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [section, setSection] = useState<'ops' | 'templates' | 'health' | 'segments'>('ops');

  useEffect(() => { trackNotificationEvent('admin_notifications_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    let list = notifications;
    if (tab !== 'all') list = list.filter((n) => n.channel === tab);
    if (channelFilter !== 'all') list = list.filter((n) => n.channel === channelFilter);
    if (statusFilter !== 'all') list = list.filter((n) => n.status === statusFilter);
    if (eventFilter !== 'all') list = list.filter((n) => n.eventType === eventFilter);
    if (audienceFilter !== 'all') list = list.filter((n) => n.audience.includes(audienceFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.eventType.includes(q) || n.channelLabel.toLowerCase().includes(q));
    }
    return list;
  }, [notifications, tab, channelFilter, statusFilter, eventFilter, audienceFilter, search]);

  const onCreate = useCallback(() => setShowBuilder(true), []);
  const onExport = useCallback(async () => {
    try { const r = await handleExport('csv'); setToast(`Export ${r.format} — ${r.rows} lignes`); trackNotificationEvent('notification_exported'); }
    catch { setToast('Export impossible'); }
  }, [handleExport]);

  const onSend = useCallback(async (data: Parameters<typeof handleSend>[0]) => {
    try { await handleSend(data); setToast('Notification envoyée'); trackNotificationEvent('notification_sent'); refresh(); }
    catch { setToast('Envoi impossible'); }
  }, [handleSend, refresh]);

  const onRetry = useCallback(async (id: string) => {
    try { await handleRetry(id); setToast('Notification relancée'); trackNotificationEvent('notification_retried'); refresh(); }
    catch { setToast('Relance impossible'); }
  }, [handleRetry, refresh]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="space-y-6">
      <NotificationsHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport} onCreate={onCreate} />
      {kpis && <NotificationKpiCards kpis={kpis} />}
      <NotificationsTabs active={tab} onChange={(t) => { setTab(t); trackNotificationEvent('notification_filter_changed', { tab: t }); }} />
      <NotificationsFilters status={statusFilter} channel={channelFilter} event={eventFilter} audience={audienceFilter} onStatus={setStatusFilter} onChannel={setChannelFilter} onEvent={setEventFilter} onAudience={setAudienceFilter} />

      <div className="flex flex-wrap gap-2">
        {(['ops', 'templates', 'health', 'segments'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setSection(s)} className={`px-3 py-1.5 rounded-xl text-sm border ${section === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
            {s === 'ops' ? 'Operations' : s === 'templates' ? 'Templates' : s === 'health' ? 'Santé & Erreurs' : 'Segments'}
          </button>
        ))}
      </div>

      {section === 'ops' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <ChannelDistributionDonut data={channelDistribution} />
            <DeliveryStatusDonut data={deliveryStatus} />
            <TopEventsTable events={topEvents} />
          </div>
          <div className="xl:col-span-2 space-y-6">
            <NotificationsTable items={filtered} onRetry={onRetry} onView={() => setToast('Détail notification')} />
            <AutomationsTable automations={automations} />
            <RecentNotificationActivity activities={activities} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <NotificationQuickActions onAction={(label) => { if (label.includes('Créer')) setShowBuilder(true); else setToast(label); }} />
            <ChannelPerformanceCard data={channelPerformance} />
            <PopularTemplatesTable templates={popularTemplates} />
          </div>
        </div>
      )}

      {section === 'templates' && <TemplateCenter templates={templates} onEdit={setEditTemplate} />}
      {section === 'health' && (
        <div className="space-y-6">
          <DeliveryHealthPanel health={providerHealth} />
          <NotificationErrorCenter errors={errors} onRetry={onRetry} />
          <UnsubscribeCenter items={unsubscribes} />
        </div>
      )}
      {section === 'segments' && <SegmentCenter segments={segments} />}

      <NotificationBuilderModal open={showBuilder} onClose={() => setShowBuilder(false)} onSubmit={onSend} />
      <TemplateEditorDrawer template={editTemplate} onClose={() => setEditTemplate(null)} onSave={() => { setToast('Template mis à jour'); refresh(); }} />
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
};
