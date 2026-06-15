import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import useOrdersCenter from '../hooks/useOrdersCenter';
import { OrdersHeader } from '../components/admin/orders/OrdersHeader';
import { OrderKpiCards } from '../components/admin/orders/OrderKpiCards';
import { OrderPipeline } from '../components/admin/orders/OrderPipeline';
import { LiveOperationsBoard } from '../components/admin/orders/LiveOperationsBoard';
import { OrderSlaCenter } from '../components/admin/orders/OrderSlaCenter';
import { OrderMap } from '../components/admin/orders/OrderMap';
import { OrderFunnel } from '../components/admin/orders/OrderFunnel';
import { OrderRevenueBlock } from '../components/admin/orders/OrderRevenueBlock';
import { OrderAnomalyCenter } from '../components/admin/orders/OrderAnomalyCenter';
import { OrderPartnersTable } from '../components/admin/orders/OrderPartnersTable';
import { OrderInvoiceWidget } from '../components/admin/orders/OrderInvoiceWidget';
import { OrderActivityStream } from '../components/admin/orders/OrderActivityStream';
import { OrderQuickActions } from '../components/admin/orders/OrderQuickActions';
import { OrderRecurringRevenueChart } from '../components/admin/orders/OrderRecurringRevenueChart';
import { AdminStatusBanner } from '../components/admin/AdminStatusBanner';

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
      <div className="h-24 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-96 bg-white rounded-2xl border animate-pulse" />
        <div className="space-y-6">
          <div className="h-44 bg-white rounded-2xl border animate-pulse" />
          <div className="h-52 bg-white rounded-2xl border animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center p-6 min-h-[50vh]">
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="warning" className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Impossible de charger les commandes.</h2>
        <p className="text-sm text-gray-500 mb-6">Une erreur est survenue lors du chargement des données.</p>
        <button
          type="button"
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
    <div className="flex items-center justify-center p-6 min-h-[50vh]">
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="shoppingBag" className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande trouvée</h2>
        <p className="text-sm text-gray-500">Les commandes apparaîtront ici dès qu&apos;une activité est détectée.</p>
      </div>
    </div>
  );
}

export const OrdersControlCenter: React.FC = () => {
  const {
    kpis,
    pipeline,
    orders,
    sla,
    funnel,
    revenue,
    revenueBlock,
    anomalies,
    partners,
    invoices,
    activity,
    mapZones,
    loading,
    error,
    degraded,
    refresh,
  } = useOrdersCenter();

  const [search, setSearch] = useState('');

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'export':
      case 'export-orders':
        window.dispatchEvent(new CustomEvent('admin-action-message', { detail: 'Export commandes en cours…' }));
        break;
      case 'view-disputes':
      case 'litiges':
        window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Litiges' }));
        break;
      case 'open-order-truth':
      case 'truth':
        window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Order Truth' }));
        break;
      case 'open-investigate':
        window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
        break;
      case 'anomalies':
        window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Anomalies' }));
        break;
      default:
        window.dispatchEvent(new CustomEvent('admin-action', { detail: `Action commandes: ${action}` }));
    }
  }, []);

  useEffect(() => {
    const runRefresh = () => handleRefresh();
    window.addEventListener('admin-orders-refresh', runRefresh);
    return () => window.removeEventListener('admin-orders-refresh', runRefresh);
  }, [handleRefresh]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={handleRefresh} />;
  if (!kpis) return <EmptyState />;

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        <OrdersHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
          onExport={() => handleQuickAction('export')}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onAddDriver={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Chauffeurs' }))}
        />

        {degraded && (
          <AdminStatusBanner variant="warning">
            Mode dégradé : affichage des données de secours en attendant la connexion complète aux endpoints
            opérationnels.
          </AdminStatusBanner>
        )}

        <OrderKpiCards kpis={kpis} />

        <OrderPipeline steps={pipeline} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <LiveOperationsBoard orders={orders} externalSearch={search} />
          </div>
          <div className="space-y-6">
            {sla && <OrderSlaCenter data={sla} />}
            {mapZones.length > 0 && <OrderMap zones={mapZones} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {funnel.length > 0 && <OrderFunnel steps={funnel} />}
          {revenue && <OrderRecurringRevenueChart data={revenue} />}
          {revenueBlock && <OrderRevenueBlock data={revenueBlock} />}
          <OrderAnomalyCenter anomalies={anomalies} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OrderPartnersTable partners={partners} />
          </div>
          <div className="space-y-6">
            {invoices && <OrderInvoiceWidget data={invoices} />}
            <OrderQuickActions onAction={handleQuickAction} />
          </div>
        </div>

        <OrderActivityStream activities={activity} />
      </div>
    </div>
  );
};
