import { describe, expect, it } from 'vitest';
import { buildLogisticsNavItems } from './logistics-nav';

describe('logistics-nav', () => {
  it('includes missions between dispatch and tracking', () => {
    const labels = buildLogisticsNavItems().map((item) => item.label);
    const dispatchIndex = labels.indexOf('Dispatch');
    const missionsIndex = labels.indexOf('Missions');
    const trackingIndex = labels.indexOf('Tracking');
    expect(missionsIndex).toBeGreaterThan(dispatchIndex);
    expect(missionsIndex).toBeLessThan(trackingIndex);
  });

  it('marks alerts with dynamic badge key', () => {
    const alerts = buildLogisticsNavItems().find((item) => item.target === 'alerts');
    expect(alerts?.badgeKey).toBe('alerts');
  });
});
