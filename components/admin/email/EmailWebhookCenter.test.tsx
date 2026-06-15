// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { EmailWebhookCenter } from './EmailWebhookCenter';

describe('EmailWebhookCenter', () => {
  it('renders webhook center', () => {
    const { container, unmount } = renderComponent(
      <EmailWebhookCenter
        webhooks={[{ id: '1', endpoint: 'https://api.example.com/webhooks/email', secretMasked: 'whsec_***', successCount: 12400, errorCount: 1, events: ['email.sent', 'email.bounced'] }]}
        onTest={vi.fn()} onReplay={vi.fn()}
      />
    );
    expect(byText(container, 'Webhook Center')).not.toBeNull();
    expect(container.textContent).toContain('email.sent');
    unmount();
  });
});
