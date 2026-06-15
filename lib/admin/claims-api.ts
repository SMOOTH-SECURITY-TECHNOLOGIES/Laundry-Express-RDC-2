import { features } from '../../config/features';
import { realApi, type BackendClaimsDashboardResponse } from '../../services/real-api';
import type { ClaimDetail, ClaimsDashboardSummary } from './claims-types';

export const CLAIMS_WRITE_ENABLED = import.meta.env.VITE_CLAIMS_WRITE_ENABLED !== 'false';

let cached: ClaimsDashboardSummary | null = null;
let promise: Promise<ClaimsDashboardSummary> | null = null;
let cachedDays = 7;

export function invalidateClaimsCache(): void {
  cached = null;
  promise = null;
}

function mapClaim(c: BackendClaimsDashboardResponse['claims'][0]) {
  return {
    id: c.id, claimNumber: c.claim_number, title: c.title, aiSummary: c.ai_summary,
    clientName: c.client_name, category: c.category, categoryLabel: c.category_label,
    priority: c.priority, priorityLabel: c.priority_label, status: c.status, statusLabel: c.status_label,
    financialImpact: c.financial_impact, slaLabel: c.sla_label, slaState: c.sla_state,
    slaMinutesRemaining: c.sla_minutes_remaining, updatedAt: c.updated_at, partnerName: c.partner_name,
  };
}

function map(raw: BackendClaimsDashboardResponse): ClaimsDashboardSummary {
  return {
    kpis: {
      openClaims: raw.kpis.open_claims, openClaimsChange: raw.kpis.open_claims_change, openClaimsSparkline: raw.kpis.open_claims_sparkline ?? [],
      criticalClaims: raw.kpis.critical_claims, criticalClaimsChange: raw.kpis.critical_claims_change, criticalClaimsSparkline: raw.kpis.critical_claims_sparkline ?? [],
      activeDisputes: raw.kpis.active_disputes, activeDisputesChange: raw.kpis.active_disputes_change, activeDisputesSparkline: raw.kpis.active_disputes_sparkline ?? [],
      refundExposure: raw.kpis.refund_exposure, refundExposureChange: raw.kpis.refund_exposure_change, refundExposureSparkline: raw.kpis.refund_exposure_sparkline ?? [],
      slaCompliance: raw.kpis.sla_compliance, slaComplianceChange: raw.kpis.sla_compliance_change, slaComplianceSparkline: raw.kpis.sla_compliance_sparkline ?? [],
      avgResolutionHours: raw.kpis.avg_resolution_hours, avgResolutionChange: raw.kpis.avg_resolution_change, avgResolutionSparkline: raw.kpis.avg_resolution_sparkline ?? [],
      resolvedThisMonth: raw.kpis.resolved_this_month, resolvedChange: raw.kpis.resolved_change, resolvedSparkline: raw.kpis.resolved_sparkline ?? [],
      amountAtRisk: raw.kpis.amount_at_risk, amountAtRiskChange: raw.kpis.amount_at_risk_change, amountAtRiskSparkline: raw.kpis.amount_at_risk_sparkline ?? [],
    },
    claims: raw.claims.map(mapClaim),
    distribution: raw.distribution.map((d) => ({ category: d.category, count: d.count, percent: d.percent, color: d.color })),
    sla: {
      inSla: raw.sla.in_sla, atRisk: raw.sla.at_risk, breached: raw.sla.breached,
      compliancePercent: raw.sla.compliance_percent,
      byCategory: raw.sla.by_category.map((c) => ({
        category: String(c.category ?? ''),
        in_sla: typeof c.in_sla === 'number' ? c.in_sla : undefined,
        at_risk: typeof c.at_risk === 'number' ? c.at_risk : undefined,
        breached: typeof c.breached === 'number' ? c.breached : undefined,
      })),
    },
    workflow: raw.workflow.map((w) => ({ stage: w.stage, stageLabel: w.stage_label, claims: w.claims.map(mapClaim) })),
    rootCauses: raw.root_causes.map((r) => ({ cause: r.cause, occurrences: r.occurrences, trend: r.trend, impact: r.impact })),
    heatmap: raw.heatmap.map((h) => ({ zone: h.zone, claims: h.claims, density: h.density })),
    partnerRisks: raw.partner_risks.map((p) => ({
      partnerId: p.partner_id, partnerName: p.partner_name, claimCount: p.claim_count,
      avgRating: p.avg_rating, refundAmount: p.refund_amount, riskScore: p.risk_score,
    })),
    driverRisks: raw.driver_risks.map((d) => ({
      driverId: d.driver_id, driverName: d.driver_name, incidentCount: d.incident_count,
      complaints: d.complaints, avgRating: d.avg_rating, riskScore: d.risk_score,
    })),
    refunds: {
      pendingCount: raw.refunds.pending_count, pendingAmount: raw.refunds.pending_amount,
      approvedCount: raw.refunds.approved_count, approvedAmount: raw.refunds.approved_amount,
      paidCount: raw.refunds.paid_count, paidAmount: raw.refunds.paid_amount,
      rejectedCount: raw.refunds.rejected_count, rejectedAmount: raw.refunds.rejected_amount,
      totalExposure: raw.refunds.total_exposure,
    },
    escalations: raw.escalations,
    source: raw.source,
  };
}

export async function fetchClaimsBundle(days = 7): Promise<ClaimsDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour le centre réclamations.');
  if (cached && cachedDays === days) return cached;
  if (promise && cachedDays === days) return promise;
  cachedDays = days;
  promise = realApi.getClaimsDashboard(days).then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function fetchClaimDetail(id: string): Promise<ClaimDetail> {
  const raw = await realApi.getClaimDetail(id);
  return {
    ...mapClaim(raw),
    description: raw.description, orderId: raw.order_id, driverName: raw.driver_name,
    riskScore: raw.risk_score, recommendation: raw.recommendation,
    timeline: raw.timeline ?? [], notes: raw.notes ?? [], attachments: raw.attachments ?? [],
    refunds: raw.refunds ?? [], escalations: raw.escalations ?? [],
  };
}

export function trackClaimEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'claims', ...detail } }));
}
