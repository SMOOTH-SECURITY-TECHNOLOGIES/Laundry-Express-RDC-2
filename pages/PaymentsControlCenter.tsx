import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import usePaymentsCenter from '../hooks/usePaymentsCenter';
import { PaymentsHeader } from '../components/admin/payments/PaymentsHeader';
import { PaymentsFiltersBar } from '../components/admin/payments/PaymentsFilters';
import { PaymentsKpiStrip } from '../components/admin/payments/PaymentsKpiStrip';
import { PaymentsTrendChart } from '../components/admin/payments/PaymentsTrendChart';
import { PaymentsMethodChart } from '../components/admin/payments/PaymentsMethodChart';
import { PaymentsZoneChart } from '../components/admin/payments/PaymentsZoneChart';
import { PaymentsTransactionsTable } from '../components/admin/payments/PaymentsTransactionsTable';
import { PaymentsFailedCard } from '../components/admin/payments/PaymentsFailedCard';
import { PaymentHealthCard } from '../components/admin/payments/PaymentHealthCard';
import { PaymentsAlertsFeed } from '../components/admin/payments/PaymentsAlertsFeed';
import { PaymentTruthCorridor } from '../components/admin/payments/PaymentTruthCorridor';
import { PaymentsReconciliation } from '../components/admin/payments/PaymentsReconciliation';
import { PaymentsFraudCard } from '../components/admin/payments/PaymentsFraudCard';
import { PaymentsCommissionWidget } from '../components/admin/payments/PaymentsCommissionWidget';
import { PaymentsRefundWidget } from '../components/admin/payments/PaymentsRefundWidget';
import { PaymentsZoneMap } from '../components/admin/payments/PaymentsZoneMap';
import { PaymentsInsights } from '../components/admin/payments/PaymentsInsights';
import { PaymentsExportCenter } from '../components/admin/payments/PaymentsExportCenter';
import { PaymentTransactionDrawer } from '../components/admin/payments/PaymentTransactionDrawer';
import type { PaymentFilters } from '../lib/admin/payments-types';

function defaultFilters(): PaymentFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    dateStart: start.toISOString().slice(0, 10), dateEnd: end.toISOString().slice(0, 10),
    status: 'Tous les statuts', method: 'Tous les moyens', zone: 'Toutes les zones', partner: 'Tous les partenaires',
    minAmount: '', maxAmount: '', reference: '', orderId: '', client: '',
  };
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-6">
      <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />)}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Impossible de charger le Payment Operations Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const PaymentsControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    kpis, trend, methods, zones, transactions, failed, health, alerts, truthCorridors,
    reconciliation, fraudSignals, commissionWidget, refundWidget, insights, transactionDetail,
    loading, error, degraded, wsConnected, refresh, handleRetry, handleExport,
  } = usePaymentsCenter();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>(defaultFilters);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const navigateInvestigate = useCallback((id: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId: id });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const onTransactionAction = useCallback((id: string, action: string) => {
    switch (action) {
      case 'view':
      case 'timeline':
        setShowDrawer(true);
        break;
      case 'investigate':
        navigateInvestigate(id);
        break;
      case 'receipt':
        setToast(`Reçu téléchargé pour ${id}`);
        break;
    }
  }, [navigateInvestigate]);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'transactions' | 'commissions' | 'refunds' | 'reconciliation' | 'anomalies') => {
    const result = await handleExport(format, scope);
    setToast(`Export ${scope} ${format.toUpperCase()} — ${result.filename} (${result.count} lignes)`);
  }, [handleExport]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refresh} />;
  if (!kpis || !health || !commissionWidget || !refundWidget) return null;

  const q = search.toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const filteredTx = transactions.filter((t) => match(t.id) || match(t.orderId) || match(t.client) || match(t.partner));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200">{toast}</div>}
        {degraded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Icon name="warning" className="w-4 h-4" /> Mode dégradé — données paiements partielles
          </div>
        )}

        <PaymentsHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportCenter(true)}
          onReconcile={() => setToast('Réconciliation lancée — analyse des écarts')}
          onInvestigate={() => navigateInvestigate('')}
          wsConnected={wsConnected}
        />

        <PaymentsFiltersBar filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} />

        <PaymentsKpiStrip kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <PaymentsTrendChart trend={trend} />
          <PaymentsMethodChart methods={methods} total={kpis.receivedAmount} />
          <PaymentsZoneChart zones={zones} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><PaymentsTransactionsTable transactions={filteredTx} onAction={onTransactionAction} /></div>
          <PaymentsFailedCard failed={failed} onRetry={handleRetry} onInvestigate={navigateInvestigate} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <PaymentHealthCard health={health} />
          <PaymentsAlertsFeed alerts={alerts} onInvestigate={navigateInvestigate} />
          <PaymentsInsights insights={insights} />
        </div>

        <PaymentTruthCorridor corridors={truthCorridors} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <PaymentsReconciliation gaps={reconciliation} onInvestigate={navigateInvestigate} />
          <PaymentsFraudCard signals={fraudSignals} onInvestigate={navigateInvestigate} />
          <PaymentsCommissionWidget data={commissionWidget} onDrillDown={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Commissions' }))} />
          <PaymentsRefundWidget data={refundWidget} onOpenRefunds={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Remboursements' }))} />
        </div>

        <PaymentsZoneMap zones={zones} />
      </div>

      <PaymentsExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
      <PaymentTransactionDrawer detail={showDrawer ? transactionDetail : null} onClose={() => setShowDrawer(false)} onInvestigate={navigateInvestigate} />
    </div>
  );
};
