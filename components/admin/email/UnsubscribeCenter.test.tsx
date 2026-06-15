// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { UnsubscribeCenter } from './UnsubscribeCenter';

describe('UnsubscribeCenter', () => {
  it('renders unsubscribe summary', () => {
    const { container, unmount } = renderComponent(
      <UnsubscribeCenter
        summary={{ total: 86, campaign: 24, marketing: 62, preferencesCount: 142 }}
        items={[{ id: '1', email: 'user@example.com', unsubscribeType: 'marketing', typeLabel: 'Marketing', reason: 'Trop de emails' }]}
      />
    );
    expect(byText(container, 'Total désabonnés')).not.toBeNull();
    expect(container.textContent).toContain('86');
    unmount();
  });
});
