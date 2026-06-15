import type {
  SubscriptionPlan,
  SubscriptionKpis,
  PlanDistribution,
  RecurringRevenuePoint,
  PlanFeature,
  SubscriptionActivity,
  SubscribedPartner,
  InvoiceKpis,
  ChurnMetrics,
  AuditItem,
} from './subscriptions-types';
import {
  subscriptionPlans,
  subscriptionKpis,
  planDistribution,
  recurringRevenue,
  planFeatures,
  recentActivities,
  subscribedPartners,
  invoiceKpis,
  churnMetrics,
  auditItems,
} from './subscriptions-fixtures';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  await delay(300);
  return [...subscriptionPlans];
}

export async function fetchSubscriptionKpis(): Promise<SubscriptionKpis> {
  await delay(250);
  return { ...subscriptionKpis };
}

export async function fetchPlanDistribution(): Promise<PlanDistribution[]> {
  await delay(200);
  return [...planDistribution];
}

export async function fetchRecurringRevenue(): Promise<RecurringRevenuePoint[]> {
  await delay(350);
  return [...recurringRevenue];
}

export async function fetchPlanFeatures(): Promise<PlanFeature[]> {
  await delay(200);
  return [...planFeatures];
}

export async function fetchRecentActivities(): Promise<SubscriptionActivity[]> {
  await delay(250);
  return [...recentActivities];
}

export async function fetchSubscribedPartners(): Promise<SubscribedPartner[]> {
  await delay(400);
  return [...subscribedPartners];
}

export async function fetchInvoiceKpis(): Promise<InvoiceKpis> {
  await delay(200);
  return { ...invoiceKpis };
}

export async function fetchChurnMetrics(): Promise<ChurnMetrics> {
  await delay(250);
  return { ...churnMetrics };
}

export async function fetchAuditItems(): Promise<AuditItem[]> {
  await delay(200);
  return [...auditItems];
}
