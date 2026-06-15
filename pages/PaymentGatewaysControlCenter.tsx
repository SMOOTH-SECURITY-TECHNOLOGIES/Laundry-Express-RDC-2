import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import usePaymentGatewaysCenter from '../hooks/usePaymentGatewaysCenter';
import { PaymentGatewayHeader } from '../components/admin/payment-gateways/PaymentGatewayHeader';
import { PaymentKpiCards } from '../components/admin/payment-gateways/PaymentKpiCards';
import { RevenueDistributionChart } from '../components/admin/payment-gateways/RevenueDistributionChart';
import { GatewayOverviewTable } from '../components/admin/payment-gateways/GatewayOverviewTable';
import { ChannelPerformanceCard } from '../components/admin/payment-gateways/ChannelPerformanceCard';
import { RecentTransactionsTable } from '../components/admin/payment-gateways/RecentTransactionsTable';
import { CashFlowWidget } from '../components/admin/payment-gateways/CashFlowWidget';
import { CommissionWidget } from '../components/admin/payment-gateways/CommissionWidget';
import { IncidentsCenter } from '../components/admin/payment-gateways/IncidentsCenter';
import { SuccessRateChart } from '../components/admin/payment-gateways/SuccessRateChart';
import { TopPartnersCard } from '../components/admin/payment-gateways/TopPartnersCard';
import { SettlementCenter } from '../components/admin/payment-gateways/SettlementCenter';
import { WebhookCenter } from '../components/admin/payment-gateways/WebhookCenter';
import { PaymentHealthPanel } from '../components/admin/payment-gateways/PaymentHealthPanel';
import { PaymentReconciliationCenter } from '../components/admin/payment-gateways/PaymentReconciliationCenter';
import { RefundCenter } from '../components/admin/payment-gateways/RefundCenter';
import { FraudDetectionCard } from '../components/admin/payment-gateways/FraudDetectionCard';
import { QuickActionsPanel } from '../components/admin/payment-gateways/QuickActionsPanel';
import { PaymentDrawer } from '../components/admin/payment-gateways/PaymentDrawer';
import { trackPaymentGatewayEvent } from '../lib/admin/payment-gateways-api';
import type { PaymentGatewayTransaction } from '../lib/admin/payment-gateways-types';

function LoadingSkeleton() {
  return <div className="space-y-6"><div className="h-28 bg-white rounded-2xl border animate-pulse" /><div className="grid grid-cols-7 gap-3">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les données.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const PaymentGatewaysControlCenter: React.FC = () => {
  const {
    kpis, gateways, revenueDistribution, channelPerformance, transactions, cashFlow,
    commissions, incidents, successRateTrend, topPartners, settlements, webhooks,
    reconciliations, providerHealth, refunds, fraud,
    loading, error, refresh, handleExport, handleReconciliation, handleTestWebhook,
  } = usePaymentGatewaysCenter();

  const [search, setSearch] = useState('');
  const [section, setSection] = useState<'overview' | 'ops' | 'health'>('overview');
  const [selectedTx, setSelectedTx] = useState<PaymentGatewayTransaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackPaymentGatewayEvent('payment_gateway_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filteredTx = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter((t) => t.reference.toLowerCase().includes(q) || t.clientName.toLowerCase().includes(q) || t.gatewayName.toLowerCase().includes(q));
  }, [transactions, search]);

  const onExport = useCallback(async () => {
    try { const r = await handleExport('csv'); setToast(`Export ${r.format} — ${r.rows} lignes`); trackPaymentGatewayEvent('payment_exported'); }
    catch { setToast('Export impossible'); }
  }, [handleExport]);

  const onReconcile = useCallback(async () => {
    try { await handleReconciliation(); setToast('Réconciliation lancée'); trackPaymentGatewayEvent('payment_reconciliation_started'); refresh(); }
    catch { setToast('Réconciliation désactivée'); }
  }, [handleReconciliation, refresh]);

  const onTestWebhook = useCallback(async (slug: string) => {
    try { await handleTestWebhook(slug); setToast(`Webhook ${slug} testé`); trackPaymentGatewayEvent('payment_webhook_tested'); }
    catch { setToast('Test webhook désactivé'); }
  }, [handleTestWebhook]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  const monthTotal = kpis?.revenueMonth ?? 42750;

  return (
    <div className="space-y-6">
      <PaymentGatewayHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport} />
      {kpis && <PaymentKpiCards kpis={kpis} />}

      <div className="flex flex-wrap gap-2">
        {(['overview', 'ops', 'health'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setSection(s)} className={`px-3 py-1.5 rounded-xl text-sm border ${section === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
            {s === 'overview' ? 'Vue d\'ensemble' : s === 'ops' ? 'Opérations' : 'Santé & Webhooks'}
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <RevenueDistributionChart data={revenueDistribution} total={monthTotal} />
            <ChannelPerformanceCard data={channelPerformance} />
            {cashFlow && <CashFlowWidget cashFlow={cashFlow} />}
          </div>
          <div className="xl:col-span-2 space-y-6">
            <GatewayOverviewTable gateways={gateways} onView={() => setToast('Détails passerelle')} />
            <RecentTransactionsTable transactions={filteredTx} onOpen={(t) => { setSelectedTx(t); trackPaymentGatewayEvent('payment_transaction_opened', { id: t.id }); }} />
            <SuccessRateChart data={successRateTrend} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <QuickActionsPanel onAction={(a) => { if (a === 'Réconciliation') onReconcile(); else if (a === 'Tester webhook') onTestWebhook('flutterwave'); else setToast(a); }} />
            {commissions && <CommissionWidget commissions={commissions} />}
            <IncidentsCenter incidents={incidents} />
            <TopPartnersCard partners={topPartners} />
          </div>
        </div>
      )}

      {section === 'ops' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettlementCenter settlements={settlements} />
          <PaymentReconciliationCenter items={reconciliations} onRun={onReconcile} />
          <RefundCenter refunds={refunds} />
          {fraud && <FraudDetectionCard fraud={fraud} />}
        </div>
      )}

      {section === 'health' && (
        <div className="space-y-6">
          <PaymentHealthPanel health={providerHealth} />
          <WebhookCenter webhooks={webhooks} onTest={onTestWebhook} />
        </div>
      )}

      <PaymentDrawer tx={selectedTx} onClose={() => setSelectedTx(null)} />
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
};
