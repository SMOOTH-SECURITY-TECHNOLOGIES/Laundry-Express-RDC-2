// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { WebhookCenter } from './WebhookCenter';

describe('WebhookCenter', () => {
  it('renders webhook endpoint', () => {
    const { container, unmount } = renderComponent(<WebhookCenter webhooks={[{
      id: '1', endpoint: 'https://api.laundryexpress.cd/webhooks/whatsapp', secretMasked: 'whsec_***',
      successCount: 84200, errorCount: 24, retryCount: 6, events: ['message_received'],
    }]} onTest={vi.fn()} onReplay={vi.fn()} />);
    expect(byText(container, 'Webhook Center')).not.toBeNull();
    unmount();
  });
});
