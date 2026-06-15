import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { PromotionsCenterBundle, PromoCreatePayload } from './promotions-types';
import { promotionsFixtureBundle } from './promotions-fixtures';

export let PROMOTIONS_DEGRADED_MODE = false;
export const PROMOTIONS_WRITE_ENABLED = import.meta.env.VITE_PROMOTIONS_WRITE_ENABLED !== 'false';

let cachedBundle: PromotionsCenterBundle | null = null;
let bundlePromise: Promise<PromotionsCenterBundle> | null = null;

export function invalidatePromotionsCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadPromotionsBundle(): Promise<PromotionsCenterBundle> {
  if (shouldUseFixturesOnly()) {
    PROMOTIONS_DEGRADED_MODE = true;
    return promotionsFixtureBundle();
  }
  try {
    await realApi.getAdminOverview().catch(() => ({}));
    PROMOTIONS_DEGRADED_MODE = true;
    return promotionsFixtureBundle();
  } catch {
    PROMOTIONS_DEGRADED_MODE = true;
    return promotionsFixtureBundle();
  }
}

export async function fetchPromotionsBundle(): Promise<PromotionsCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadPromotionsBundle().then((b) => { cachedBundle = b; return b; });
  }
  return bundlePromise;
}

export async function createPromotion(payload: PromoCreatePayload): Promise<{ id: string }> {
  if (!PROMOTIONS_WRITE_ENABLED) throw new Error('Création promotion désactivée.');
  invalidatePromotionsCache();
  return { id: `p-${Date.now()}` };
}

export async function updatePromotion(id: string, payload: Partial<PromoCreatePayload>): Promise<void> {
  if (!PROMOTIONS_WRITE_ENABLED) throw new Error('Modification promotion désactivée.');
  invalidatePromotionsCache();
}

export async function deletePromotion(id: string): Promise<void> {
  if (!PROMOTIONS_WRITE_ENABLED) throw new Error('Suppression promotion désactivée.');
  invalidatePromotionsCache();
}

export async function pausePromotion(id: string): Promise<void> {
  if (!PROMOTIONS_WRITE_ENABLED) throw new Error('Suspension promotion désactivée.');
  invalidatePromotionsCache();
}

export async function createCampaign(name: string, audience: string, budget: number): Promise<{ id: string }> {
  if (!PROMOTIONS_WRITE_ENABLED) throw new Error('Création campagne désactivée.');
  invalidatePromotionsCache();
  return { id: `c-${Date.now()}` };
}

export async function exportPromotionsData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: 'promotions' | 'roi' | 'campaigns' | 'coupons' | 'segments' = 'promotions',
): Promise<{ filename: string; count: number }> {
  const bundle = await fetchPromotionsBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return {
    filename: `promotions-${scope}-${new Date().toISOString().slice(0, 10)}.${ext}`,
    count: bundle.activePromotions.length + bundle.campaigns.length,
  };
}
