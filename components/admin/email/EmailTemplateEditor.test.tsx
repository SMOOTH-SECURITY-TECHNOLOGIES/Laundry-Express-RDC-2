// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { EmailTemplateEditor } from './EmailTemplateEditor';

const tpl = {
  id: '1', name: 'test', templateType: 'transactional', typeLabel: 'Transactionnel',
  language: 'fr', subject: 'Sujet test', status: 'active', usageCount: 0, openRate: 0, clickRate: 0, version: 1,
};

describe('EmailTemplateEditor', () => {
  it('renders editor fields', () => {
    const { container, unmount } = renderComponent(
      <EmailTemplateEditor open template={tpl} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(byText(container, 'Email Template Editor')).not.toBeNull();
    expect(byText(container, 'Preview desktop')).not.toBeNull();
    unmount();
  });
});
