import { useState, useEffect, useCallback } from 'react';
import {
  fetchPlans,
  fetchSubscriptionKpis,
  fetchPlanDistribution,
  fetchRecurringRevenue,
  fetchPlanFeatures,
  fetchRecentActivities,
  fetchSubscribedPartners,
  fetchInvoiceKpis,
  fetchChurnMetrics,
  fetchAuditItems,
} from '../lib/admin/subscriptions-api';
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
} from '../lib/admin/subscriptions-types';

interface UseSubscriptionsReturn {
  kpis: SubscriptionKpis | null;
  plans: SubscriptionPlan[];
  distribution: PlanDistribution[];
  revenue: RecurringRevenuePoint[];
  features: PlanFeature[];
  activity: SubscriptionActivity[];
  partners: SubscribedPartner[];
  invoices: InvoiceKpis | null;
  churn: ChurnMetrics | null;
  audit: AuditItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export default function useSubscriptions(): UseSubscriptionsReturn {
  const [kpis, setKpis] = useState<SubscriptionKpis | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [distribution, setDistribution] = useState<PlanDistribution[]>([]);
  const [revenue, setRevenue] = useState<RecurringRevenuePoint[]>([]);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [activity, setActivity] = useState<SubscriptionActivity[]>([]);
  const [partners, setPartners] = useState<SubscribedPartner[]>([]);
  const [invoices, setInvoices] = useState<InvoiceKpis | null>(null);
  const [churn, setChurn] = useState<ChurnMetrics | null>(null);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        kpisData,
        plansData,
        distributionData,
        revenueData,
        featuresData,
        activityData,
        partnersData,
        invoicesData,
        churnData,
        auditData,
      ] = await Promise.all([
        fetchSubscriptionKpis(),
        fetchPlans(),
        fetchPlanDistribution(),
        fetchRecurringRevenue(),
        fetchPlanFeatures(),
        fetchRecentActivities(),
        fetchSubscribedPartners(),
        fetchInvoiceKpis(),
        fetchChurnMetrics(),
        fetchAuditItems(),
      ]);

      setKpis(kpisData);
      setPlans(plansData);
      setDistribution(distributionData);
      setRevenue(revenueData);
      setFeatures(featuresData);
      setActivity(activityData);
      setPartners(partnersData);
      setInvoices(invoicesData);
      setChurn(churnData);
      setAudit(auditData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
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
  };
}
