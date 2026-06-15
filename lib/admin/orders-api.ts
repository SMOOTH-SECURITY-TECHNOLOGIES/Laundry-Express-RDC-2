import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
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
} from './orders-types';
import {
  orderKpis,
  orderPipeline,
  liveOrders,
  orderSlaData,
  orderFunnel,
  orderRevenueData,
  orderRevenueBlock,
  orderAnomalies,
  orderPartners,
  orderInvoiceKpis,
  orderActivity,
  orderMapZones,
} from './orders-fixtures';
import {
  mapActivityLogs,
  mapOrdersToAnomalies,
  mapOrdersToFunnel,
  mapOrdersToInvoices,
  mapOrdersToKpis,
  mapOrdersToLiveOrders,
  mapOrdersToMapZones,
  mapOrdersToPartners,
  mapOrdersToPipeline,
  mapOrdersToRevenue,
  mapOrdersToRevenueBlock,
  mapOrdersToSla,
} from './orders-mappers';

export let ORDERS_DEGRADED_MODE = false;

let cachedBundle: OrdersCenterBundle | null = null;
let bundlePromise: Promise<OrdersCenterBundle> | null = null;

export function invalidateOrdersCenterCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

export interface OrdersCenterBundle {
  kpis: OrderKpis;
  pipeline: PipelineStep[];
  orders: LiveOrder[];
  sla: OrderSlaData;
  funnel: OrderFunnelStep[];
  revenue: OrderRevenueData;
  revenueBlock: OrderRevenueBlock;
  anomalies: OrderAnomaly[];
  partners: OrderPartner[];
  invoices: OrderInvoiceKpis;
  activity: OrderActivity[];
  mapZones: OrderMapZone[];
  degraded: boolean;
}

function fixtureBundle(): OrdersCenterBundle {
  return {
    kpis: orderKpis,
    pipeline: orderPipeline,
    orders: liveOrders,
    sla: orderSlaData,
    funnel: orderFunnel,
    revenue: orderRevenueData,
    revenueBlock: orderRevenueBlock,
    anomalies: orderAnomalies,
    partners: orderPartners,
    invoices: orderInvoiceKpis,
    activity: orderActivity,
    mapZones: orderMapZones,
    degraded: true,
  };
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadOrdersCenterBundle(): Promise<OrdersCenterBundle> {
  if (shouldUseFixturesOnly()) {
    ORDERS_DEGRADED_MODE = true;
    return fixtureBundle();
  }

  try {
    const [ordersResponse, overview, tasksResponse, driversResponse, activityResponse] =
      await Promise.all([
        realApi.getOrders({ page: 1, page_size: 200 }),
        realApi.getAdminOverview(),
        realApi.getLogisticsTasks({ page: 1, page_size: 200 }),
        realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
        realApi.getAdminActivityLogs(20),
      ]);

    const orders = ordersResponse.orders ?? [];
    const tasks = tasksResponse.tasks ?? [];
    const drivers = driversResponse.drivers ?? [];
    const logs = activityResponse.logs ?? [];

    ORDERS_DEGRADED_MODE = false;

    const kpis = mapOrdersToKpis(orders, overview);
    const pipeline = mapOrdersToPipeline(orders);
    const live = mapOrdersToLiveOrders(orders, tasks, drivers);
    const sla = mapOrdersToSla(orders);
    const funnel = mapOrdersToFunnel(orders, overview);
    const revenue = mapOrdersToRevenue(orders, overview);
    const revenueBlock = mapOrdersToRevenueBlock(orders, overview);
    const anomalies = mapOrdersToAnomalies(orders, overview);
    const partners = mapOrdersToPartners(orders);
    const invoices = mapOrdersToInvoices(orders);
    const activity = mapActivityLogs(logs);
    const mapZones = mapOrdersToMapZones(orders);

    return {
      kpis,
      pipeline,
      orders: live.length > 0 ? live : liveOrders,
      sla,
      funnel,
      revenue,
      revenueBlock,
      anomalies: anomalies.length > 0 ? anomalies : orderAnomalies,
      partners: partners.length > 0 ? partners : orderPartners,
      invoices,
      activity: activity.length > 0 ? activity : orderActivity,
      mapZones: mapZones.length > 0 ? mapZones : orderMapZones,
      degraded: false,
    };
  } catch {
    ORDERS_DEGRADED_MODE = true;
    return fixtureBundle();
  }
}

export async function fetchOrdersCenterBundle(): Promise<OrdersCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadOrdersCenterBundle().then((bundle) => {
      cachedBundle = bundle;
      return bundle;
    });
  }
  return bundlePromise;
}

export function setOrdersDegradedMode(enabled: boolean): void {
  ORDERS_DEGRADED_MODE = enabled;
}

export async function fetchOrderKpis(): Promise<OrderKpis> {
  return (await fetchOrdersCenterBundle()).kpis;
}

export async function fetchOrderPipeline(): Promise<PipelineStep[]> {
  return (await fetchOrdersCenterBundle()).pipeline;
}

export async function fetchLiveOrders(statusFilter?: string): Promise<LiveOrder[]> {
  const orders = (await fetchOrdersCenterBundle()).orders;
  if (!statusFilter || statusFilter === 'all') return orders;
  return orders.filter((o) => o.status.toLowerCase().includes(statusFilter.toLowerCase()));
}

export async function fetchOrderSlaData(): Promise<OrderSlaData> {
  return (await fetchOrdersCenterBundle()).sla;
}

export async function fetchOrderFunnel(): Promise<OrderFunnelStep[]> {
  return (await fetchOrdersCenterBundle()).funnel;
}

export async function fetchOrderRevenue(): Promise<OrderRevenueData> {
  return (await fetchOrdersCenterBundle()).revenue;
}

export async function fetchOrderRevenueBlock(): Promise<OrderRevenueBlock> {
  return (await fetchOrdersCenterBundle()).revenueBlock;
}

export async function fetchOrderAnomalies(): Promise<OrderAnomaly[]> {
  return (await fetchOrdersCenterBundle()).anomalies;
}

export async function fetchOrderPartners(): Promise<OrderPartner[]> {
  return (await fetchOrdersCenterBundle()).partners;
}

export async function fetchOrderInvoiceKpis(): Promise<OrderInvoiceKpis> {
  return (await fetchOrdersCenterBundle()).invoices;
}

export async function fetchOrderActivity(): Promise<OrderActivity[]> {
  return (await fetchOrdersCenterBundle()).activity;
}

export async function fetchOrderMapZones(): Promise<OrderMapZone[]> {
  return (await fetchOrdersCenterBundle()).mapZones;
}

export async function searchOrders(query: string): Promise<LiveOrder[]> {
  const q = query.toLowerCase();
  const orders = (await fetchOrdersCenterBundle()).orders;
  return orders.filter(
    (o) =>
      o.id.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      o.partnerName.toLowerCase().includes(q) ||
      o.commune.toLowerCase().includes(q),
  );
}
