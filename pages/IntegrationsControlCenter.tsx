import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useIntegrationsCenter from '../hooks/useIntegrationsCenter';
import { ApiDashboardHeader } from '../components/admin/integrations/ApiDashboardHeader';
import { ApiKpiCards } from '../components/admin/integrations/ApiKpiCards';
import { ApiKeysTable } from '../components/admin/integrations/ApiKeysTable';
import { WebhookTable } from '../components/admin/integrations/WebhookTable';
import { WebhookLogsDrawer } from '../components/admin/integrations/WebhookLogsDrawer';
import { TrackingCenter } from '../components/admin/integrations/TrackingCenter';
import { IntegrationHealthGrid } from '../components/admin/integrations/IntegrationHealthGrid';
import { ApiAnalyticsCharts } from '../components/admin/integrations/ApiAnalyticsCharts';
import { SecurityPanel } from '../components/admin/integrations/SecurityPanel';
import { DeveloperDocsPanel } from '../components/admin/integrations/DeveloperDocsPanel';
import { AlertsPanel } from '../components/admin/integrations/AlertsPanel';
import { ApiLogTable } from '../components/admin/integrations/ApiLogTable';
import { QuickActions } from '../components/admin/integrations/QuickActions';
import { trackIntegrationsEvent } from '../lib/admin/integrations-api';
import type { Webhook } from '../lib/admin/integrations-types';

const TABS = ['overview', 'api-keys', 'webhooks', 'tracking', 'integrations', 'logs', 'analytics', 'security', 'documentation'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview', 'api-keys': 'API Keys', webhooks: 'Webhooks', tracking: 'Tracking',
  integrations: 'Integrations', logs: 'Logs', analytics: 'Analytics', security: 'Security', documentation: 'Documentation',
};

function LoadingSkeleton() {
  return <div className="space-y-6"><div className="h-28 bg-white rounded-2xl border animate-pulse" /><div className="grid grid-cols-8 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les intégrations.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const IntegrationsControlCenter: React.FC = () => {
  const {
    kpis, apiKeys, webhooks, webhookDeliveries, tracking, serverSideTracking,
    integrations, logs, analytics, eventDistribution, topEndpoints, security, alerts, openapi,
    loading, error, refresh,
  } = useIntegrationsCenter();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackIntegrationsEvent('admin_integrations_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const q = search.toLowerCase();
  const filteredKeys = useMemo(() => apiKeys.filter((k) => !q || k.name.toLowerCase().includes(q) || k.scope.toLowerCase().includes(q)), [apiKeys, q]);
  const filteredWebhooks = useMemo(() => webhooks.filter((w) => !q || w.name.toLowerCase().includes(q) || w.event.includes(q) || w.url.includes(q)), [webhooks, q]);
  const filteredLogs = useMemo(() => logs.filter((l) => !q || l.endpoint.toLowerCase().includes(q) || (l.integrationName || '').toLowerCase().includes(q)), [logs, q]);

  const onQuick = useCallback((label: string) => {
    if (label === 'Créer une clé API') { setTab('api-keys'); trackIntegrationsEvent('api_key_created'); setToast('Génération clé API'); }
    else if (label === 'Tester un webhook') { setTab('webhooks'); trackIntegrationsEvent('webhook_tested'); setToast('Webhook testé'); }
    else if (label === 'Vérifier la santé') setTab('integrations');
    else if (label === 'Exporter logs') setToast('Export lancé');
    else if (label === 'Ouvrir analytics') setTab('analytics');
    else setToast(label);
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="space-y-6">
      <ApiDashboardHeader
        search={search} onSearchChange={setSearch} onRefresh={() => refresh()}
        onExport={() => setToast('Export CSV lancé')}
        onCreateWebhook={() => { trackIntegrationsEvent('webhook_created'); setTab('webhooks'); setToast('Créer webhook'); }}
        onCreateApiKey={() => { trackIntegrationsEvent('api_key_created'); setTab('api-keys'); setToast('Générer clé API'); }}
        onDocs={() => setTab('documentation')}
      />
      {kpis && <ApiKpiCards kpis={kpis} />}

      <div className="flex flex-wrap gap-2">{TABS.map((t) => (
        <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>{TAB_LABELS[t]}</button>
      ))}</div>

      {tab === 'overview' && serverSideTracking && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <ApiAnalyticsCharts analytics={analytics.slice(0, 2)} eventDistribution={[]} topEndpoints={topEndpoints.slice(0, 3)} />
            <ApiKeysTable keys={filteredKeys.slice(0, 4)} onAction={(a) => setToast(a)} />
            <WebhookTable webhooks={filteredWebhooks.slice(0, 4)} onAction={(a, w) => { if (a === 'logs') setSelectedWebhook(w); else setToast(a); }} onSelect={setSelectedWebhook} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <IntegrationHealthGrid integrations={integrations.slice(0, 6)} />
            <AlertsPanel alerts={alerts} />
            <QuickActions onAction={onQuick} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            {tracking.length > 0 && serverSideTracking && (
              <TrackingCenter tracking={tracking.slice(0, 4)} serverSide={serverSideTracking} onSave={(p) => { trackIntegrationsEvent('tracking_updated', { provider: p }); setToast(`Tracking ${p} mis à jour`); }} />
            )}
          </div>
        </div>
      )}

      {tab === 'api-keys' && <ApiKeysTable keys={filteredKeys} onAction={(a) => setToast(a)} />}
      {tab === 'webhooks' && <WebhookTable webhooks={filteredWebhooks} onAction={(a, w) => { if (a === 'logs') setSelectedWebhook(w); else if (a === 'test') trackIntegrationsEvent('webhook_tested'); else if (a === 'replay') trackIntegrationsEvent('webhook_replayed'); setToast(a); }} onSelect={setSelectedWebhook} />}
      {tab === 'tracking' && serverSideTracking && <TrackingCenter tracking={tracking} serverSide={serverSideTracking} onSave={(p) => { trackIntegrationsEvent('tracking_updated', { provider: p }); setToast(`Tracking ${p} mis à jour`); }} />}
      {tab === 'integrations' && <IntegrationHealthGrid integrations={integrations} />}
      {tab === 'logs' && <ApiLogTable logs={filteredLogs} />}
      {tab === 'analytics' && <ApiAnalyticsCharts analytics={analytics} eventDistribution={eventDistribution} topEndpoints={topEndpoints} />}
      {tab === 'security' && security && <SecurityPanel security={security} />}
      {tab === 'documentation' && openapi && <DeveloperDocsPanel openapi={openapi} />}

      <WebhookLogsDrawer webhook={selectedWebhook} deliveries={webhookDeliveries} onClose={() => setSelectedWebhook(null)} />
      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50">{toast}</div>}
    </div>
  );
};
