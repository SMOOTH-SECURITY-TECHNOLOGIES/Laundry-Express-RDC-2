// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { EmailKpiCards } from './EmailKpiCards';

const kpis = {
  sentToday: 18420, sentTodayChange: 15.8, sentTodaySparkline: [],
  deliveryRate: 99.1, deliveryRateChange: 0.4, deliveryRateSparkline: [],
  openRate: 38.4, openRateChange: 2.1, openRateSparkline: [],
  clickRate: 9.2, clickRateChange: 1.4, clickRateSparkline: [],
  bounces: 214, bouncesChange: -12, bouncesSparkline: [],
  unsubscribes: 86, unsubscribesChange: 3.2, unsubscribesSparkline: [],
  activeTemplates: 42, activeTemplatesChange: 2, activeTemplatesSparkline: [],
  attributedRevenue: 12850, attributedRevenueChange: 18.5, attributedRevenueSparkline: [],
};

describe('EmailKpiCards', () => {
  it('renders sent today KPI', () => {
    const { container, unmount } = renderComponent(<EmailKpiCards kpis={kpis} />);
    expect(byText(container, "Emails envoyés aujourd'hui")).not.toBeNull();
    expect(container.textContent?.replace(/[\s\u00a0\u202f]/g, '')).toContain('18420');
    unmount();
  });
});
