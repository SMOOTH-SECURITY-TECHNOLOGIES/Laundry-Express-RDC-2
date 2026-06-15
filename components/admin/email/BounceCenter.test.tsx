// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { BounceCenter } from './BounceCenter';

describe('BounceCenter', () => {
  it('renders bounce table', () => {
    const { container, unmount } = renderComponent(
      <BounceCenter bounces={[{ id: '1', email: 'bad@invalid.com', bounceType: 'hard', bounceTypeLabel: 'Hard bounce', reason: 'Mailbox not found', providerCode: '550', occurredAt: '2026-06-09' }]} />
    );
    expect(byText(container, 'Bounce Center')).not.toBeNull();
    expect(container.textContent).toContain('bad@invalid.com');
    unmount();
  });
});
