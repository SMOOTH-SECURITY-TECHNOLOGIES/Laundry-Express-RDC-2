import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useWhatsappCenter from '../hooks/useWhatsappCenter';
import { WhatsappHeader } from '../components/admin/whatsapp/WhatsappHeader';
import { WhatsappKpiCards } from '../components/admin/whatsapp/WhatsappKpiCards';
import { LiveConversationMonitor } from '../components/admin/whatsapp/LiveConversationMonitor';
import { ConversationTable } from '../components/admin/whatsapp/ConversationTable';
import { ConversationDrawer } from '../components/admin/whatsapp/ConversationDrawer';
import { TemplateCenter } from '../components/admin/whatsapp/TemplateCenter';
import { TemplateBuilderModal } from '../components/admin/whatsapp/TemplateBuilderModal';
import { NotificationCenter } from '../components/admin/whatsapp/NotificationCenter';
import { CampaignCenter } from '../components/admin/whatsapp/CampaignCenter';
import { CampaignBuilder } from '../components/admin/whatsapp/CampaignBuilder';
import { AutomationCenter } from '../components/admin/whatsapp/AutomationCenter';
import { WorkflowBuilder } from '../components/admin/whatsapp/WorkflowBuilder';
import { WhatsappAiCenter } from '../components/admin/whatsapp/WhatsappAiCenter';
import { QualityCenter } from '../components/admin/whatsapp/QualityCenter';
import { WebhookCenter } from '../components/admin/whatsapp/WebhookCenter';
import { CostCenter } from '../components/admin/whatsapp/CostCenter';
import { AnalyticsPanel } from '../components/admin/whatsapp/AnalyticsPanel';
import { AudienceSegmentPanel } from '../components/admin/whatsapp/AudienceSegmentPanel';
import { SlaPanel } from '../components/admin/whatsapp/SlaPanel';
import { QuickActionsPanel } from '../components/admin/whatsapp/QuickActionsPanel';
import { trackWhatsappEvent } from '../lib/admin/whatsapp-api';
import type { WhatsappConversation } from '../lib/admin/whatsapp-types';

const TABS = ['overview', 'conversations', 'templates', 'notifications', 'campaigns', 'automations', 'webhooks', 'analytics'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: 'Vue générale', conversations: 'Conversations', templates: 'Templates', notifications: 'Notifications',
  campaigns: 'Campagnes', automations: 'Automatisations', webhooks: 'Webhooks', analytics: 'Analytics',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-8 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div>
      <div className="h-64 bg-white rounded-2xl border animate-pulse" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les données WhatsApp.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const WhatsappControlCenter: React.FC = () => {
  const {
    kpis, conversations, liveMonitor, templates, notifications, campaigns, automations,
    webhooks, quality, aiMetrics, costs, analytics, segments, sla,
    loading, error, refresh, handleExport, handleTestWebhook,
  } = useWhatsappCenter();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedConv, setSelectedConv] = useState<WhatsappConversation | null>(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackWhatsappEvent('whatsapp_dashboard_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.clientName.toLowerCase().includes(q) || c.phone.includes(q) || (c.lastMessage || '').toLowerCase().includes(q));
  }, [conversations, search]);

  const humanIntervention = useMemo(() => conversations.filter((c) => c.status === 'escalated' || c.status === 'new' || (c.waitTimeSec > 900 && c.status === 'open')), [conversations]);

  const onExport = useCallback(async () => {
    try { const r = await handleExport('csv'); setToast(`Export ${r.format} — ${r.rows} conversations`); trackWhatsappEvent('whatsapp_exported'); }
    catch { setToast('Export impossible'); }
  }, [handleExport]);

  const onTestWebhook = useCallback(async () => {
    try { await handleTestWebhook(); setToast('Webhook testé'); trackWhatsappEvent('whatsapp_webhook_tested'); }
    catch { setToast('Test webhook désactivé'); }
  }, [handleTestWebhook]);

  const onOpenConv = useCallback((c: WhatsappConversation) => {
    setSelectedConv(c);
    trackWhatsappEvent('whatsapp_conversation_opened', { id: c.id });
  }, []);

  const onQuickAction = useCallback((label: string) => {
    if (label === 'Tester webhook') onTestWebhook();
    else if (label === 'Export conversations') onExport();
    else if (label === 'Créer template') setShowTemplateBuilder(true);
    else if (label === 'Créer campagne') setShowCampaignBuilder(true);
    else if (label === 'Ouvrir analytics') setTab('analytics');
    else setToast(label);
  }, [onTestWebhook, onExport]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="space-y-6">
      <WhatsappHeader
        search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport}
        onCreateCampaign={() => setShowCampaignBuilder(true)} onSendMessage={() => setToast('Envoyer message')}
        onAddTemplate={() => setShowTemplateBuilder(true)}
      />
      {kpis && <WhatsappKpiCards kpis={kpis} />}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && liveMonitor && quality && aiMetrics && costs && sla && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <ConversationTable conversations={filteredConvs.slice(0, 8)} onOpen={onOpenConv} onAction={(a) => setToast(a)} />
            {humanIntervention.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-orange-800">{humanIntervention.length} conversations nécessitent une intervention humaine</p>
              </div>
            )}
          </div>
          <div className="xl:col-span-1 space-y-6">
            <LiveConversationMonitor monitor={liveMonitor} />
            <SlaPanel sla={sla} />
            <QuickActionsPanel onAction={onQuickAction} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <CostCenter costs={costs} />
            <QualityCenter quality={quality} />
            <WhatsappAiCenter metrics={aiMetrics} onReview={() => trackWhatsappEvent('whatsapp_ai_reviewed')} />
          </div>
        </div>
      )}

      {tab === 'conversations' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><ConversationTable conversations={filteredConvs} onOpen={onOpenConv} onAction={(a) => setToast(a)} /></div>
          {liveMonitor && <LiveConversationMonitor monitor={liveMonitor} />}
        </div>
      )}

      {tab === 'templates' && <TemplateCenter templates={templates} onAction={(a) => setToast(a)} />}
      {tab === 'notifications' && <NotificationCenter notifications={notifications} />}
      {tab === 'campaigns' && <CampaignCenter campaigns={campaigns} onCreate={() => setShowCampaignBuilder(true)} />}
      {tab === 'automations' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AutomationCenter automations={automations} onCreate={() => setShowWorkflowBuilder(true)} />
          <AudienceSegmentPanel segments={segments} />
        </div>
      )}
      {tab === 'webhooks' && <WebhookCenter webhooks={webhooks} onTest={onTestWebhook} onReplay={() => setToast('Webhook rejoué')} />}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <AnalyticsPanel series={analytics} />
          {costs && <CostCenter costs={costs} />}
        </div>
      )}

      <ConversationDrawer conversation={selectedConv} detail={selectedConv ? {
        ...selectedConv, messages: [{ from: 'client', text: selectedConv.lastMessage || '' }],
        linkedOrders: [], linkedTickets: [], internalNotes: [], aiSuggestions: [],
      } : null} onClose={() => setSelectedConv(null)} />

      <TemplateBuilderModal open={showTemplateBuilder} onClose={() => setShowTemplateBuilder(false)} onSave={() => { trackWhatsappEvent('whatsapp_template_created'); setToast('Template créé'); }} />
      <CampaignBuilder open={showCampaignBuilder} onClose={() => setShowCampaignBuilder(false)} />
      <WorkflowBuilder open={showWorkflowBuilder} onClose={() => setShowWorkflowBuilder(false)} />

      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50">{toast}</div>}
    </div>
  );
};
