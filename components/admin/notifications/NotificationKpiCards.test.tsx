// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { NotificationKpiCards } from './NotificationKpiCards';

const kpis = {
  totalSent: 124580, totalSentChange: 18.6, totalSentSparkline: [100000, 124580],
  deliveryRate: 98.7, deliveryRateChange: 2.3, deliveryRateSparkline: [96, 98.7],
  emailOpenRate: 32.4, emailOpenRateChange: 4.1, emailOpenRateSparkline: [28, 32.4],
  clickRate: 8.6, clickRateChange: 1.2, clickRateSparkline: [7, 8.6],
  unsubscribes: 245, unsubscribesChange: -5.4, unsubscribesSparkline: [260, 245],
  errors: 1248, errorsChange: 12.7, errorsSparkline: [1100, 1248],
};

describe('NotificationKpiCards', () => {
  it('renders all KPI labels', () => {
    const { container, unmount } = renderComponent(<NotificationKpiCards kpis={kpis} />);
    expect(byText(container, 'Total envoyées')).not.toBeNull();
    expect(byText(container, 'Taux de livraison')).not.toBeNull();
    expect(byText(container, '98.7%')).not.toBeNull();
    unmount();
  });
});
