// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { DeliverabilityCenter } from './DeliverabilityCenter';

describe('DeliverabilityCenter', () => {
  it('renders deliverability data', () => {
    const { container, unmount } = renderComponent(
      <DeliverabilityCenter
        deliverability={[{ domain: 'laundryexpress.cd', healthStatus: 'healthy', healthLabel: 'Healthy', spf: 'OK', dkim: 'OK', dmarc: 'OK', bounceRate: 0.4, spamComplaints: 0.1, reputationScore: 92 }]}
        domainPerformance={[{ domain: 'gmail.com', deliveryRate: 99.4, openRate: 42.1, clickRate: 10.2, bounceRate: 0.6 }]}
      />
    );
    expect(byText(container, 'Deliverability Center')).not.toBeNull();
    expect(container.textContent).toContain('laundryexpress.cd');
    unmount();
  });
});
