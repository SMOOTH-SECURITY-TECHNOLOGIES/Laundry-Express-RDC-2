import React, { useCallback, useEffect } from 'react';
import useSubscriptions from '../hooks/useSubscriptions';
import { SubscriptionKpiCards } from '../components/admin/subscriptions/SubscriptionKpiCards';
import { PlanCards } from '../components/admin/subscriptions/PlanCards';
import { PlanDistributionChart } from '../components/admin/subscriptions/PlanDistributionChart';
import { RecurringRevenueChart } from '../components/admin/subscriptions/RecurringRevenueChart';
import { PlanComparisonTable } from '../components/admin/subscriptions/PlanComparisonTable';
import { SubscriptionQuickActions } from '../components/admin/subscriptions/SubscriptionQuickActions';
import { SubscriptionActivity } from '../components/admin/subscriptions/SubscriptionActivity';
import { SubscribedPartnersTable } from '../components/admin/subscriptions/SubscribedPartnersTable';
import { InvoiceWidget } from '../components/admin/subscriptions/InvoiceWidget';
import { ChurnAnalysis } from '../components/admin/subscriptions/ChurnAnalysis';
import { SubscriptionAudit } from '../components/admin/subscriptions/SubscriptionAudit';
import { ExportCenter } from '../components/admin/subscriptions/ExportCenter';
import { Icon } from '../components/Icon';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-20 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-80 bg-white rounded-2xl border animate-pulse" />
        <div className="h-80 bg-white rounded-2xl border animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="warning" className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Icon name="arrow-path" className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="shoppingBag" className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune donnée disponible</h2>
        <p className="text-sm text-gray-500">Le centre de contrôle des abonnements est vide.</p>
      </div>
    </div>
  );
}

export const SubscriptionsControlCenter: React.FC = () => {
  const {
    kpis,
    plans,
    distribution,
    revenue,
    features,
    activity,
    partners,
    invoices,
    churn,
    audit,
    loading,
    error,
    refresh,
  } = useSubscriptions();

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const runRefresh = () => handleRefresh();
    window.addEventListener('admin-subscriptions-refresh', runRefresh);
    return () => window.removeEventListener('admin-subscriptions-refresh', runRefresh);
  }, [handleRefresh]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={handleRefresh} />;
  if (!kpis) return <EmptyState />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {/* ─── HEADER ─── */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6 -mx-6 -mt-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscriptions Control Center</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gestion des abonnements, facturation et rétention partenaires</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon name="arrow-path" className="w-4 h-4" />
                Actualiser
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Icon name="plus" className="w-4 h-4" />
                Nouveau plan
              </button>
            </div>
          </div>
        </header>

        {/* ─── KPI STRIP ─── */}
        <SubscriptionKpiCards />

        {/* ─── BLUE INFO BANNER ─── */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <Icon name="sparkles" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Tableau de bord abonnements</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Suivi en temps réel des abonnements partenaires, de la facturation récurrente et des métriques de rétention.
            </p>
          </div>
        </div>

        {/* ─── ROW: Plans (3 cols) + Donut + Revenue ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <PlanCards />
          </div>
          <div className="lg:col-span-1">
            <PlanDistributionChart />
          </div>
          <div className="lg:col-span-1">
            <RecurringRevenueChart />
          </div>
        </div>

        {/* ─── ROW: Comparison + Quick Actions + Activity ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <PlanComparisonTable features={features} />
          </div>
          <div className="lg:col-span-1">
            <SubscriptionQuickActions onCreate={() => {}} />
          </div>
          <div className="lg:col-span-1">
            <SubscriptionActivity activities={activity} />
          </div>
        </div>

        {/* ─── ROW: Partners + Invoicing + Churn + Audit ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2">
            <SubscribedPartnersTable partners={partners} />
          </div>
          <div className="xl:col-span-1 flex flex-col gap-6">
            {invoices && <InvoiceWidget data={invoices} />}
            {churn && <ChurnAnalysis metrics={churn} />}
          </div>
          <div className="xl:col-span-1">
            {audit.length > 0 && <SubscriptionAudit items={audit} />}
          </div>
        </div>

        {/* ─── EXPORT CENTER ─── */}
        <ExportCenter />
      </div>

      {/* ─── TECH FOOTER ─── */}
      <div className="border-t border-gray-200 bg-white">
      </div>
    </div>
  );
};

export default SubscriptionsControlCenter;
