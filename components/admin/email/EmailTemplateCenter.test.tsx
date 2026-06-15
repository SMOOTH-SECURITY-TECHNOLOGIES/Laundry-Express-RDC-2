// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { EmailTemplateCenter } from './EmailTemplateCenter';

const tpl = {
  id: '1', name: 'confirmation_commande', templateType: 'transactional', typeLabel: 'Transactionnel',
  language: 'fr', subject: 'Votre commande est confirmée', status: 'active', usageCount: 12400,
  openRate: 68.2, clickRate: 12.4, version: 3,
};

describe('EmailTemplateCenter', () => {
  it('renders template center', () => {
    const { container, unmount } = renderComponent(
      <EmailTemplateCenter templates={[tpl]} onEdit={vi.fn()} />
    );
    expect(byText(container, 'Template Center')).not.toBeNull();
    expect(container.textContent).toContain('confirmation_commande');
    unmount();
  });
});
