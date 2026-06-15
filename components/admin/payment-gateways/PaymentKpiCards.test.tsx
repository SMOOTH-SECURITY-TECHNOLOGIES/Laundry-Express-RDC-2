// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { PaymentKpiCards } from './PaymentKpiCards';

const kpis = {
  revenueTrend: 18.4, revenueTrendSparkline: [14, 18],
  revenueToday: 1850, revenueTodayChange: 9, revenueTodayTx: 138,
  revenueWeek: 11000, revenueWeekChange: 12, revenueWeekTx: 785,
  revenueMonth: 42750, revenueMonthChange: 18, revenueMonthTx: 3245,
  commissionsDue: 5240, commissionsDueOps: 246,
  commissionsPaid: 18900, commissionsPaidOps: 156,
  cashInTransit: 2460, cashInTransitOps: 87,
};

describe('PaymentKpiCards', () => {
  it('renders revenue KPIs', () => {
    const { container, unmount } = renderComponent(<PaymentKpiCards kpis={kpis} />);
    expect(byText(container, "Revenu aujourd'hui")).not.toBeNull();
    expect(byText(container, 'Revenu mois')).not.toBeNull();
    expect(container.textContent?.replace(/[\s\u00a0\u202f]/g, '')).toContain('42750');
    unmount();
  });
});
