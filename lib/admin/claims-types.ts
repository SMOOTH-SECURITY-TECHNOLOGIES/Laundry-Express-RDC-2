export interface ClaimsKpis {
  openClaims: number; openClaimsChange: number; openClaimsSparkline: number[];
  criticalClaims: number; criticalClaimsChange: number; criticalClaimsSparkline: number[];
  activeDisputes: number; activeDisputesChange: number; activeDisputesSparkline: number[];
  refundExposure: number; refundExposureChange: number; refundExposureSparkline: number[];
  slaCompliance: number; slaComplianceChange: number; slaComplianceSparkline: number[];
  avgResolutionHours: number; avgResolutionChange: number; avgResolutionSparkline: number[];
  resolvedThisMonth: number; resolvedChange: number; resolvedSparkline: number[];
  amountAtRisk: number; amountAtRiskChange: number; amountAtRiskSparkline: number[];
}

export interface ClaimItem {
  id: string; claimNumber: string; title: string; aiSummary: string;
  clientName: string; category: string; categoryLabel: string;
  priority: string; priorityLabel: string; status: string; statusLabel: string;
  financialImpact: number; slaLabel: string; slaState: string;
  slaMinutesRemaining: number | null; updatedAt: string | null; partnerName?: string | null;
}

export interface ClaimDetail extends ClaimItem {
  description: string; orderId?: string | null; driverName?: string | null;
  riskScore: number; recommendation: string;
  timeline: Array<{ event: string; date: string | null; detail: string }>;
  notes: Array<{ content: string; author_id: string }>;
  attachments: Array<{ url: string; mime: string | null }>;
  refunds: Array<{ amount: number; status: string }>;
  escalations: Array<{ reason: string; severity: string }>;
}

export interface ClaimDistribution { category: string; count: number; percent: number; color: string }
export interface ClaimSlaPanel { inSla: number; atRisk: number; breached: number; compliancePercent: number; byCategory: Array<{ category: string; in_sla?: number; at_risk?: number; breached?: number }> }
export interface ClaimWorkflowColumn { stage: string; stageLabel: string; claims: ClaimItem[] }
export interface RootCause { cause: string; occurrences: number; trend: number; impact: string }
export interface HeatmapZone { zone: string; claims: number; density: number }
export interface PartnerRisk { partnerId: string; partnerName: string; claimCount: number; avgRating: number; refundAmount: number; riskScore: number }
export interface DriverRisk { driverId: string; driverName: string; incidentCount: number; complaints: number; avgRating: number; riskScore: number }
export interface RefundCenter {
  pendingCount: number; pendingAmount: number; approvedCount: number; approvedAmount: number;
  paidCount: number; paidAmount: number; rejectedCount: number; rejectedAmount: number; totalExposure: number;
}

export interface ClaimsDashboardSummary {
  kpis: ClaimsKpis;
  claims: ClaimItem[];
  distribution: ClaimDistribution[];
  sla: ClaimSlaPanel;
  workflow: ClaimWorkflowColumn[];
  rootCauses: RootCause[];
  heatmap: HeatmapZone[];
  partnerRisks: PartnerRisk[];
  driverRisks: DriverRisk[];
  refunds: RefundCenter;
  escalations: Array<{ reason: string; severity: string; claim_id?: string; count?: number }>;
  source: string;
}
