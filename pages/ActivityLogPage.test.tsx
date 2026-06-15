// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../hooks/useActivityLogCenter', () => ({
  default: () => ({
    kpis: {
      totalActivities: 4840, totalChange: 18.6, totalSparkline: [],
      adminActivities: 40, adminChange: 12.4,
      partnerActivities: 26, partnerChange: 9.3,
      driverActivities: 42, driverChange: 15.2,
      systemActivities: 0, systemChange: 0,
      anomalies: 0, anomaliesChange: 0,
    },
    events: [], liveEvents: [], heatmap: [], topActivities: [], corridorHealth: [],
    actorDistribution: [], severityDistribution: [], total: 0,
    loading: false, error: null, refresh: vi.fn(),
  }),
}));

import { ActivityLogControlCenter } from './ActivityLogControlCenter';

describe('ActivityLogControlCenter', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders journal admin header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<ActivityLogControlCenter />); });
    expect(container.textContent).toContain('Journal admin');
    expect(container.textContent).toMatch(/4[\s\u00a0]?840/);
    await act(async () => root.unmount());
    container.remove();
  });
});
