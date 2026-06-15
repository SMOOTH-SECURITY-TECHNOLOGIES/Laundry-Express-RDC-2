import { AnomalyItem, AnomalySummary, SystemHealthItem, ImpactedCorridor, RevenueLeakageItem, AnomalyActivityEvent, ResolveAnomalyPayload, CreateInvestigationPayload } from './anomalies-types';
import { MOCK_SUMMARY, MOCK_SYSTEM_HEALTH, MOCK_CORRIDORS, MOCK_ANOMALIES, MOCK_REVENUE_LEAKAGE, MOCK_ACTIVITY_FEED } from './anomalies-fixtures';

// In production, replace these with real API calls
// For now, all functions return mock data with artificial delay

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchAnomalySummary(): Promise<AnomalySummary> {
  await delay(300);
  return MOCK_SUMMARY;
}

export async function fetchSystemHealth(): Promise<SystemHealthItem[]> {
  await delay(200);
  return MOCK_SYSTEM_HEALTH;
}

export async function fetchImpactedCorridors(): Promise<ImpactedCorridor[]> {
  await delay(250);
  return MOCK_CORRIDORS;
}

export async function fetchAnomalies(filters?: Record<string, string>): Promise<{ items: AnomalyItem[]; total: number }> {
  await delay(400);
  let items = [...MOCK_ANOMALIES];
  if (filters) {
    if (filters.severity && filters.severity !== 'all') items = items.filter(a => a.severity === filters.severity);
    if (filters.corridor && filters.corridor !== 'all') items = items.filter(a => a.corridor === filters.corridor);
    if (filters.status && filters.status !== 'all') items = items.filter(a => a.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(a => a.title.toLowerCase().includes(q) || a.reference.toLowerCase().includes(q) || (a.partnerName || '').toLowerCase().includes(q) || (a.clientName || '').toLowerCase().includes(q) || (a.driverName || '').toLowerCase().includes(q));
    }
  }
  return { items, total: items.length };
}

export async function fetchRevenueLeakage(): Promise<RevenueLeakageItem[]> {
  await delay(200);
  return MOCK_REVENUE_LEAKAGE;
}

export async function fetchActivityFeed(): Promise<AnomalyActivityEvent[]> {
  await delay(150);
  return MOCK_ACTIVITY_FEED;
}

export async function investigateAnomaly(id: string): Promise<void> {
  await delay(500);
  console.log(`Investigating anomaly ${id}`);
}

export async function createTicket(id: string): Promise<void> {
  await delay(400);
  console.log(`Creating ticket for anomaly ${id}`);
}

export async function resolveAnomaly(id: string, payload: ResolveAnomalyPayload): Promise<void> {
  await delay(600);
  console.log(`Resolving anomaly ${id}`, payload);
}

export async function createInvestigation(payload: CreateInvestigationPayload): Promise<void> {
  await delay(500);
  console.log('Creating investigation', payload);
}

export async function runAudit(type: string): Promise<void> {
  await delay(1000);
  console.log(`Running audit: ${type}`);
}

export async function exportReport(): Promise<void> {
  await delay(800);
  console.log('Exporting report');
}
