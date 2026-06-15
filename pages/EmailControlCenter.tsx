import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useEmailCenter from '../hooks/useEmailCenter';
import { EmailHeader } from '../components/admin/email/EmailHeader';
import { EmailKpiCards } from '../components/admin/email/EmailKpiCards';
import { RecentEmailTable } from '../components/admin/email/RecentEmailTable';
import { TypeDistributionChart } from '../components/admin/email/TypeDistributionChart';
import { EmailTemplateCenter } from '../components/admin/email/EmailTemplateCenter';
import { EmailTemplateEditor } from '../components/admin/email/EmailTemplateEditor';
import { EmailCampaignCenter } from '../components/admin/email/EmailCampaignCenter';
import { EmailAutomationTable } from '../components/admin/email/EmailAutomationTable';
import { DeliverabilityCenter } from '../components/admin/email/DeliverabilityCenter';
import { BounceCenter } from '../components/admin/email/BounceCenter';
import { UnsubscribeCenter } from '../components/admin/email/UnsubscribeCenter';
import { InvoiceEmailPanel } from '../components/admin/email/InvoiceEmailPanel';
import { EmailWebhookCenter } from '../components/admin/email/EmailWebhookCenter';
import { EmailAnalyticsPanel } from '../components/admin/email/EmailAnalyticsPanel';
import { EmailQuickActions } from '../components/admin/email/EmailQuickActions';
import { AlertsPanel } from '../components/admin/email/AlertsPanel';
import { EmailMessageDrawer } from '../components/admin/email/EmailMessageDrawer';
import { trackEmailEvent } from '../lib/admin/email-api';
import type { EmailMessage, EmailTemplate } from '../lib/admin/email-types';

const TABS = ['overview', 'sends', 'campaigns', 'templates', 'invoices', 'automations', 'webhooks', 'analytics', 'settings'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: "Vue d'ensemble", sends: 'Envois', campaigns: 'Campagnes', templates: 'Templates',
  invoices: 'Factures', automations: 'Automatisations', webhooks: 'Webhooks', analytics: 'Analytics', settings: 'Paramètres',
};

function LoadingSkeleton() {
  return <div className="space-y-6"><div className="h-28 bg-white rounded-2xl border animate-pulse" /><div className="grid grid-cols-8 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les données Email.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const EmailControlCenter: React.FC = () => {
  const {
    kpis, messages, templates, campaigns, automations, typeDistribution, domainPerformance,
    deliverability, bounces, unsubscribeSummary, unsubscribes, invoiceSummary, invoices,
    webhooks, alerts, analytics, settings, loading, error, refresh, handleExport,
  } = useEmailCenter();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackEmailEvent('admin_email_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => m.reference.toLowerCase().includes(q) || m.recipientEmail.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q) || (m.templateName || '').includes(q));
  }, [messages, search]);

  const onExport = useCallback(async () => {
    try { const r = await handleExport('csv'); setToast(`Export ${r.format} — ${r.rows} lignes`); trackEmailEvent('email_exported'); }
    catch { setToast('Export impossible'); }
  }, [handleExport]);

  const onQuick = useCallback((label: string) => {
    if (label === 'Exporter logs') onExport();
    else if (label === 'Créer template') setEditTemplate({ id: '', name: '', templateType: 'transactional', typeLabel: 'Transactionnel', language: 'fr', subject: '', status: 'active', usageCount: 0, openRate: 0, clickRate: 0, version: 1 });
    else if (label === 'Voir bounces') setTab('settings');
    else if (label === 'Voir désabonnés') setTab('settings');
    else if (label === 'Ouvrir analytics') setTab('analytics');
    else setToast(label);
  }, [onExport]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  const typeTotal = typeDistribution.reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-6">
      <EmailHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport} onCreateEmail={() => setEditTemplate({ id: '', name: '', templateType: 'transactional', typeLabel: 'Transactionnel', language: 'fr', subject: '', status: 'active', usageCount: 0, openRate: 0, clickRate: 0, version: 1 })} />
      {kpis && <EmailKpiCards kpis={kpis} />}

      <div className="flex flex-wrap gap-2">{TABS.map((t) => (
        <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>{TAB_LABELS[t]}</button>
      ))}</div>

      {tab === 'overview' && unsubscribeSummary && invoiceSummary && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <RecentEmailTable messages={filtered.slice(0, 10)} onOpen={(m) => { setSelectedMsg(m); trackEmailEvent('email_message_opened', { id: m.id }); }} onAction={(a) => { if (a === 'retry') trackEmailEvent('email_retry_clicked'); setToast(a); }} />
            <EmailAutomationTable automations={automations} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <TypeDistributionChart data={typeDistribution} total={typeTotal} />
            <AlertsPanel alerts={alerts} />
            <EmailQuickActions onAction={onQuick} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <EmailCampaignCenter campaigns={campaigns.slice(0, 3)} />
            <DeliverabilityCenter deliverability={deliverability} domainPerformance={domainPerformance} />
          </div>
        </div>
      )}

      {tab === 'sends' && <RecentEmailTable messages={filtered} onOpen={setSelectedMsg} onAction={(a) => setToast(a)} />}
      {tab === 'campaigns' && <EmailCampaignCenter campaigns={campaigns} />}
      {tab === 'templates' && <EmailTemplateCenter templates={templates} onEdit={setEditTemplate} />}
      {tab === 'invoices' && invoiceSummary && <InvoiceEmailPanel summary={invoiceSummary} invoices={invoices} />}
      {tab === 'automations' && <EmailAutomationTable automations={automations} />}
      {tab === 'webhooks' && <EmailWebhookCenter webhooks={webhooks} onTest={() => { trackEmailEvent('email_webhook_tested'); setToast('Webhook testé'); }} onReplay={() => setToast('Événement rejoué')} />}
      {tab === 'analytics' && <EmailAnalyticsPanel series={analytics} />}
      {tab === 'settings' && unsubscribeSummary && (
        <div className="space-y-6">
          <DeliverabilityCenter deliverability={deliverability} domainPerformance={domainPerformance} />
          <BounceCenter bounces={bounces} />
          <UnsubscribeCenter summary={unsubscribeSummary} items={unsubscribes} />
          {settings && <div className="bg-white rounded-2xl border p-5 text-sm"><p>Provider : {settings.provider}</p><p>From : {settings.fromEmail}</p><p>Reply-to : {settings.replyTo}</p></div>}
        </div>
      )}

      <EmailMessageDrawer message={selectedMsg} onClose={() => setSelectedMsg(null)} />
      <EmailTemplateEditor open={!!editTemplate} template={editTemplate} onClose={() => setEditTemplate(null)} onSave={() => { trackEmailEvent('email_template_created'); setToast('Template enregistré'); }} />
      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50">{toast}</div>}
    </div>
  );
};
