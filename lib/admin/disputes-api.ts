import {
  DisputeRequest,
  DisputeSummary,
  DisputeBreakdownItem,
  DisputeStatusAmount,
  RefundTrendPoint,
  PartnerRefundRanking,
  RootCauseItem,
  DisputeSlaSummary,
  DisputeFinancialImpact,
  DisputeAnomaly,
  PlatformProtectionSummary,
  DisputeActivityEvent,
  DisputeFilterState,
  CreateDisputePayload,
  ApproveRefundPayload,
  RejectRefundPayload,
  AuditDisputesPayload,
} from './disputes-types';

import {
  mockSummary,
  mockDisputeRequests,
  mockBreakdown,
  mockStatusAmounts,
  mockTrend,
  mockPartnerRanking,
  mockRootCauses,
  mockSla,
  mockFinancialImpact,
  mockAnomalies,
  mockProtection,
  mockActivity,
  mockPartnerNames,
} from './disputes-fixtures';

/** Set to true when backend write endpoints are aligned */
export const DISPUTES_WRITE_ENABLED = false;

/** Simulates degraded mode when primary API is unavailable */
export let DISPUTES_DEGRADED_MODE = false;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyFilters(requests: DisputeRequest[], filters?: Partial<DisputeFilterState>): DisputeRequest[] {
  if (!filters) return requests;

  return requests.filter((req) => {
    if (filters.status && req.status !== filters.status) return false;
    if (filters.type && req.type !== filters.type) return false;
    if (filters.severity && req.severity !== filters.severity) return false;
    if (filters.partner && req.partnerName !== filters.partner) return false;
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      if (new Date(req.requestedAt).getTime() < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 86400000;
      if (new Date(req.requestedAt).getTime() > to) return false;
    }
    if (filters.amountRange) {
      const [min, max] = filters.amountRange.split('-').map(Number);
      if (filters.amountRange === '50+') {
        if (req.amount <= 50) return false;
      } else if (filters.amountRange === '10-50') {
        if (req.amount < 10 || req.amount > 50) return false;
      } else if (filters.amountRange === '0-10') {
        if (req.amount >= 10) return false;
      } else if (!Number.isNaN(min) && !Number.isNaN(max)) {
        if (req.amount < min || req.amount > max) return false;
      }
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [req.id, req.orderId, req.clientName, req.partnerName, req.reason].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function getDisputeSummary(): Promise<DisputeSummary> {
  await delay(200);
  return { ...mockSummary };
}

export async function getDisputeRequests(filters?: Partial<DisputeFilterState>): Promise<DisputeRequest[]> {
  await delay(250);
  return applyFilters([...mockDisputeRequests], filters);
}

export async function getDisputeBreakdown(): Promise<DisputeBreakdownItem[]> {
  await delay(200);
  return [...mockBreakdown];
}

export async function getDisputeStatusAmounts(): Promise<DisputeStatusAmount[]> {
  await delay(150);
  return [...mockStatusAmounts];
}

export async function getRefundTrend(): Promise<RefundTrendPoint[]> {
  await delay(300);
  return [...mockTrend];
}

export async function getPartnerRefundRanking(): Promise<PartnerRefundRanking[]> {
  await delay(200);
  return [...mockPartnerRanking];
}

export async function getRootCauses(): Promise<RootCauseItem[]> {
  await delay(150);
  return [...mockRootCauses];
}

export async function getDisputeSla(): Promise<DisputeSlaSummary> {
  await delay(150);
  return { ...mockSla };
}

export async function getDisputeFinancialImpact(): Promise<DisputeFinancialImpact> {
  await delay(200);
  return { ...mockFinancialImpact };
}

export async function getDisputeAnomalies(): Promise<DisputeAnomaly[]> {
  await delay(200);
  return [...mockAnomalies];
}

export async function getPlatformProtection(): Promise<PlatformProtectionSummary> {
  await delay(150);
  return { ...mockProtection };
}

export async function getDisputeActivity(): Promise<DisputeActivityEvent[]> {
  await delay(200);
  return [...mockActivity];
}

export async function getDisputePartners(): Promise<string[]> {
  await delay(100);
  return [...mockPartnerNames];
}

export async function createDispute(payload: CreateDisputePayload): Promise<DisputeRequest> {
  await delay(300);
  if (!DISPUTES_WRITE_ENABLED) {
    throw new Error('WRITE_DISABLED');
  }
  const newRequest: DisputeRequest = {
    id: `REF-${Date.now()}`,
    orderId: payload.orderId,
    clientName: payload.clientName,
    partnerName: '—',
    amount: payload.amount,
    currency: 'USD',
    type: payload.type,
    status: 'pending',
    severity: payload.priority,
    reason: payload.reason,
    requestedAt: new Date().toISOString(),
    evidenceCount: 0,
    truthScore: 50,
    assignedTo: payload.assignedTo,
  };
  mockDisputeRequests.unshift(newRequest);
  return newRequest;
}

export async function approveDispute(id: string, payload: ApproveRefundPayload): Promise<void> {
  await delay(300);
  if (!DISPUTES_WRITE_ENABLED) throw new Error('WRITE_DISABLED');
  const req = mockDisputeRequests.find((r) => r.id === id);
  if (req) {
    req.status = 'approved';
    req.resolvedAt = new Date().toISOString();
    req.amount = payload.approvedAmount;
  }
}

export async function rejectDispute(id: string, _payload: RejectRefundPayload): Promise<void> {
  await delay(300);
  if (!DISPUTES_WRITE_ENABLED) throw new Error('WRITE_DISABLED');
  const req = mockDisputeRequests.find((r) => r.id === id);
  if (req) {
    req.status = 'rejected';
    req.resolvedAt = new Date().toISOString();
  }
}

export async function assignDispute(id: string, assignee: string): Promise<void> {
  await delay(200);
  if (!DISPUTES_WRITE_ENABLED) throw new Error('WRITE_DISABLED');
  const req = mockDisputeRequests.find((r) => r.id === id);
  if (req) req.assignedTo = assignee;
}

export async function investigateDispute(id: string): Promise<void> {
  await delay(200);
  if (!DISPUTES_WRITE_ENABLED) throw new Error('WRITE_DISABLED');
  const req = mockDisputeRequests.find((r) => r.id === id);
  if (req) req.status = 'under_review';
}

export async function exportDisputes(): Promise<{ url: string; count: number }> {
  await delay(400);
  return { url: '/exports/disputes-2026-06-08.csv', count: mockSummary.totalRequests };
}

export async function auditDisputes(payload: AuditDisputesPayload): Promise<{ auditId: string }> {
  await delay(500);
  const scope = payload.auditFull
    ? 'full'
    : [
        payload.auditPayments && 'payments',
        payload.auditQuality && 'quality',
        payload.auditSla && 'sla',
        payload.auditRefunds && 'refunds',
      ]
        .filter(Boolean)
        .join('-') || 'none';
  return { auditId: `AUD-${scope}-${Date.now()}` };
}

export function setDegradedMode(enabled: boolean): void {
  DISPUTES_DEGRADED_MODE = enabled;
}
