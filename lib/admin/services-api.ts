import type { AdminServiceSummary, AdminServicePerformance, AdminServiceRevenuePoint, AdminServiceMixItem, AdminServiceGeoZone, AdminServiceHealthItem, AdminServiceTruthCorridor, AdminServiceFunnelStep, AdminServiceWatchItem, AdminServiceRankingItem, AdminServiceCatalogItem, AdminServiceAlert } from './services-types';
import { MOCK_SUMMARY, MOCK_PERFORMANCE, MOCK_REVENUE, MOCK_MIX, MOCK_GEO, MOCK_HEALTH, MOCK_TRUTH, MOCK_FUNNEL, MOCK_WATCHLIST, MOCK_RANKINGS, MOCK_CATALOG, MOCK_ALERTS } from './services-fixtures';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchServiceSummary(): Promise<AdminServiceSummary> { await delay(300); return MOCK_SUMMARY; }
export async function fetchServicePerformance(): Promise<AdminServicePerformance[]> { await delay(350); return MOCK_PERFORMANCE; }
export async function fetchServiceRevenue(): Promise<AdminServiceRevenuePoint[]> { await delay(300); return MOCK_REVENUE; }
export async function fetchServiceMix(): Promise<AdminServiceMixItem[]> { await delay(250); return MOCK_MIX; }
export async function fetchServiceGeo(): Promise<AdminServiceGeoZone[]> { await delay(400); return MOCK_GEO; }
export async function fetchServiceHealth(): Promise<AdminServiceHealthItem[]> { await delay(300); return MOCK_HEALTH; }
export async function fetchServiceTruth(): Promise<AdminServiceTruthCorridor[]> { await delay(250); return MOCK_TRUTH; }
export async function fetchServiceFunnel(): Promise<AdminServiceFunnelStep[]> { await delay(300); return MOCK_FUNNEL; }
export async function fetchServiceWatchlist(): Promise<AdminServiceWatchItem[]> { await delay(200); return MOCK_WATCHLIST; }
export async function fetchServiceRankings(): Promise<Record<string, AdminServiceRankingItem[]>> { await delay(250); return MOCK_RANKINGS; }
export async function fetchServiceCatalog(): Promise<AdminServiceCatalogItem[]> { await delay(350); return MOCK_CATALOG; }
export async function fetchServiceAlerts(): Promise<AdminServiceAlert[]> { await delay(200); return MOCK_ALERTS; }
export async function createService(data: any): Promise<void> { await delay(500); console.log('Creating service', data); }
export async function updatePricing(id: string, price: number): Promise<void> { await delay(400); console.log('Updating pricing', id, price); }
export async function exportCatalog(): Promise<void> { await delay(800); console.log('Exporting catalog'); }
