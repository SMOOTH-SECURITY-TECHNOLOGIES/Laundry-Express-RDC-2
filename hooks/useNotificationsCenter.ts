import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotificationsBundle, invalidateNotificationsCache,
  sendNotification, retryNotification, createNotificationTemplate, exportNotifications,
} from '../lib/admin/notifications-api';
import type {
  NotificationKpis, NotificationItem, ChannelDistribution, DeliveryStatusBucket,
  TopEvent, ChannelPerformance, PopularTemplate, NotificationAutomation,
  NotificationActivity, ProviderHealth, NotificationError, NotificationUnsubscribe,
  NotificationSegment, NotificationTemplate, NotificationSendPayload, NotificationTemplatePayload,
} from '../lib/admin/notifications-types';

export default function useNotificationsCenter(initialDays = 30) {
  const [kpis, setKpis] = useState<NotificationKpis | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<ChannelDistribution[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusBucket[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<PopularTemplate[]>([]);
  const [automations, setAutomations] = useState<NotificationAutomation[]>([]);
  const [activities, setActivities] = useState<NotificationActivity[]>([]);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [errors, setErrors] = useState<NotificationError[]>([]);
  const [unsubscribes, setUnsubscribes] = useState<NotificationUnsubscribe[]>([]);
  const [segments, setSegments] = useState<NotificationSegment[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);

  const apply = useCallback((b: Awaited<ReturnType<typeof fetchNotificationsBundle>>) => {
    setKpis(b.kpis); setNotifications(b.notifications);
    setChannelDistribution(b.channelDistribution); setDeliveryStatus(b.deliveryStatus);
    setTopEvents(b.topEvents); setChannelPerformance(b.channelPerformance);
    setPopularTemplates(b.popularTemplates); setAutomations(b.automations);
    setActivities(b.activities); setProviderHealth(b.providerHealth);
    setErrors(b.errors); setUnsubscribes(b.unsubscribes);
    setSegments(b.segments); setTemplates(b.templates);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true); setError(null);
    try { apply(await fetchNotificationsBundle(d)); }
    catch { setError('Impossible de charger les notifications.'); }
    finally { setLoading(false); }
  }, [apply, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateNotificationsCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, notifications, channelDistribution, deliveryStatus, topEvents, channelPerformance,
    popularTemplates, automations, activities, providerHealth, errors, unsubscribes, segments, templates,
    loading, error, days, refresh,
    handleSend: (data: NotificationSendPayload) => sendNotification(data),
    handleRetry: (id: string) => retryNotification(id),
    handleCreateTemplate: (data: NotificationTemplatePayload) => createNotificationTemplate(data),
    handleExport: (format?: string) => exportNotifications(format),
  };
}
