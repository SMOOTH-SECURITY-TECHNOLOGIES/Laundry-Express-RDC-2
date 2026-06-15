import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useSmsCenter from '../hooks/useSmsCenter';
import { SmsHeader } from '../components/admin/sms/SmsHeader';
import { SmsKpiCards } from '../components/admin/sms/SmsKpiCards';
import { OperatorDistributionChart } from '../components/admin/sms/OperatorDistributionChart';
import { RecentSendsTable } from '../components/admin/sms/RecentSendsTable';
import { OperatorPerformanceTable } from '../components/admin/sms/OperatorPerformanceTable';
import { DeliveryStatusDonut } from '../components/admin/sms/DeliveryStatusDonut';
import { CampaignsTable } from '../components/admin/sms/CampaignsTable';
import { CreditsPanel } from '../components/admin/sms/CreditsPanel';
import { TopSendersTable } from '../components/admin/sms/TopSendersTable';
import { AlertsPanel } from '../components/admin/sms/AlertsPanel';
import { TemplateCenter } from '../components/admin/sms/TemplateCenter';
import { TemplateEditorModal } from '../components/admin/sms/TemplateEditorModal';
import { OtpCenter } from '../components/admin/sms/OtpCenter';
import { LogsCenter } from '../components/admin/sms/LogsCenter';
import { AnalyticsPanel } from '../components/admin/sms/AnalyticsPanel';
import { WebhookPanel } from '../components/admin/sms/WebhookPanel';
import { SettingsPanel } from '../components/admin/sms/SettingsPanel';
import { LiveActivityFeed } from '../components/admin/sms/LiveActivityFeed';
import { CampaignBuilder } from '../components/admin/sms/CampaignBuilder';
import { QuickActionsPanel } from '../components/admin/sms/QuickActionsPanel';
import { trackSmsEvent } from '../lib/admin/sms-api';
import type { SmsMessage, SmsTemplate } from '../lib/admin/sms-types';

const TABS = ['overview', 'sends', 'campaigns', 'templates', 'senders', 'otp', 'logs', 'analytics', 'webhooks', 'settings'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: "Vue d'ensemble", sends: 'Envois', campaigns: 'Campagnes', templates: 'Modèles',
  senders: 'Expéditeurs', otp: 'OTP', logs: 'Logs', analytics: 'Analytics', webhooks: 'API & Webhooks', settings: 'Paramètres',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-8 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les données SMS.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const SmsControlCenter: React.FC = () => {
  const {
    kpis, operatorDistribution, messages, operatorPerformance, deliveryStatus, campaigns, templates, senders,
    credits, creditLedger, otpKpis, otpRecords, alerts, analytics, activities, webhooks, settings, logs,
    loading, error, refresh, handleExport,
  } = useSmsCenter();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [editTemplate, setEditTemplate] = useState<SmsTemplate | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<SmsMessage | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackSmsEvent('sms_dashboard_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => m.reference.toLowerCase().includes(q) || m.phoneNumber.includes(q) || (m.recipientName || '').toLowerCase().includes(q));
  }, [messages, search]);

  const onExport = useCallback(async () => {
    try { const r = await handleExport('csv'); setToast(`Export ${r.format} — ${r.rows} lignes`); trackSmsEvent('sms_exported'); }
    catch { setToast('Export impossible'); }
  }, [handleExport]);

  const onQuick = useCallback((label: string) => {
    if (label === 'Créer campagne') setShowCampaignBuilder(true);
    else if (label === 'Export SMS') onExport();
    else if (label === 'Ouvrir analytics') setTab('analytics');
    else if (label === 'Voir logs') setTab('logs');
    else if (label === 'Nouveau template') setEditTemplate({ id: '', name: '', category: 'transaction', categoryLabel: 'Transaction', content: '', active: true, usageCount: 0, deliveryRate: 0 });
    else setToast(label);
  }, [onExport]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="space-y-6">
      <SmsHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport} onCreateCampaign={() => setShowCampaignBuilder(true)} />
      {kpis && <SmsKpiCards kpis={kpis} />}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>{TAB_LABELS[t]}</button>
        ))}
      </div>

      {tab === 'overview' && credits && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <OperatorDistributionChart data={operatorDistribution} />
            <DeliveryStatusDonut data={deliveryStatus} />
            <AlertsPanel alerts={alerts} />
          </div>
          <div className="xl:col-span-2 space-y-6">
            <RecentSendsTable messages={filtered.slice(0, 10)} onOpen={(m) => { setSelectedMsg(m); trackSmsEvent('sms_message_opened', { id: m.id }); }} onAction={(a) => setToast(a)} />
            <OperatorPerformanceTable data={operatorPerformance} />
            <CampaignsTable campaigns={campaigns.slice(0, 4)} onCreate={() => setShowCampaignBuilder(true)} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <CreditsPanel credits={credits} ledger={creditLedger} />
            <TopSendersTable senders={senders} />
            <LiveActivityFeed activities={activities} />
            <QuickActionsPanel onAction={onQuick} />
          </div>
        </div>
      )}

      {tab === 'sends' && <RecentSendsTable messages={filtered} onOpen={setSelectedMsg} onAction={(a) => setToast(a)} />}
      {tab === 'campaigns' && <CampaignsTable campaigns={campaigns} onCreate={() => setShowCampaignBuilder(true)} />}
      {tab === 'templates' && <TemplateCenter templates={templates} onEdit={setEditTemplate} />}
      {tab === 'senders' && <TopSendersTable senders={senders} />}
      {tab === 'otp' && otpKpis && <OtpCenter kpis={otpKpis} records={otpRecords} />}
      {tab === 'logs' && <LogsCenter logs={logs} onOpen={() => setToast('Détail log')} />}
      {tab === 'analytics' && <AnalyticsPanel series={analytics} />}
      {tab === 'webhooks' && <WebhookPanel webhooks={webhooks} />}
      {tab === 'settings' && settings && <SettingsPanel settings={settings} />}

      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedMsg(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl p-5">
            <h3 className="font-bold mb-2">{selectedMsg.reference}</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedMsg.phoneNumber} · {selectedMsg.statusLabel}</p>
            <p className="text-sm">Opérateur : {selectedMsg.operatorName}</p>
            <p className="text-sm">Coût : {selectedMsg.cost.toFixed(3)} $</p>
            <button type="button" onClick={() => setSelectedMsg(null)} className="mt-4 px-4 py-2 border rounded-xl text-sm">Fermer</button>
          </div>
        </div>
      )}

      <CampaignBuilder open={showCampaignBuilder} onClose={() => setShowCampaignBuilder(false)} />
      <TemplateEditorModal open={!!editTemplate} template={editTemplate} onClose={() => setEditTemplate(null)} onSave={() => { trackSmsEvent('sms_template_saved'); setToast('Template enregistré'); }} />

      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50">{toast}</div>}
    </div>
  );
};
