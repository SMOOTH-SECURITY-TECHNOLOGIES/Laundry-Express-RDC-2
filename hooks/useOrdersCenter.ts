import { useState, useEffect, useCallback } from 'react';
import { fetchOrdersCenterBundle, invalidateOrdersCenterCache } from '../lib/admin/orders-api';
import type {
  OrderKpis,
  PipelineStep,
  LiveOrder,
  OrderSlaData,
  OrderFunnelStep,
  OrderRevenueData,
  OrderRevenueBlock,
  OrderAnomaly,
  OrderPartner,
  OrderInvoiceKpis,
  OrderActivity,
  OrderMapZone,
} from '../lib/admin/orders-types';

interface UseOrdersCenterReturn {
  kpis: OrderKpis | null;
  pipeline: PipelineStep[];
  orders: LiveOrder[];
  sla: OrderSlaData | null;
  funnel: OrderFunnelStep[];
  revenue: OrderRevenueData | null;
  revenueBlock: OrderRevenueBlock | null;
  anomalies: OrderAnomaly[];
  partners: OrderPartner[];
  invoices: OrderInvoiceKpis | null;
  activity: OrderActivity[];
  mapZones: OrderMapZone[];
  loading: boolean;
  error: string | null;
  degraded: boolean;
  refresh: () => Promise<void>;
}

export default function useOrdersCenter(): UseOrdersCenterReturn {
  const [kpis, setKpis] = useState<OrderKpis | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [sla, setSla] = useState<OrderSlaData | null>(null);
  const [funnel, setFunnel] = useState<OrderFunnelStep[]>([]);
  const [revenue, setRevenue] = useState<OrderRevenueData | null>(null);
  const [revenueBlock, setRevenueBlock] = useState<OrderRevenueBlock | null>(null);
  const [anomalies, setAnomalies] = useState<OrderAnomaly[]>([]);
  const [partners, setPartners] = useState<OrderPartner[]>([]);
  const [invoices, setInvoices] = useState<OrderInvoiceKpis | null>(null);
  const [activity, setActivity] = useState<OrderActivity[]>([]);
  const [mapZones, setMapZones] = useState<OrderMapZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateOrdersCenterCache();
      const bundle = await fetchOrdersCenterBundle();

      setKpis(bundle.kpis);
      setPipeline(bundle.pipeline);
      setOrders(bundle.orders);
      setSla(bundle.sla);
      setFunnel(bundle.funnel);
      setRevenue(bundle.revenue);
      setRevenueBlock(bundle.revenueBlock);
      setAnomalies(bundle.anomalies);
      setPartners(bundle.partners);
      setInvoices(bundle.invoices);
      setActivity(bundle.activity);
      setMapZones(bundle.mapZones);
      setDegraded(bundle.degraded);
    } catch {
      setError('Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
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
  };
}
