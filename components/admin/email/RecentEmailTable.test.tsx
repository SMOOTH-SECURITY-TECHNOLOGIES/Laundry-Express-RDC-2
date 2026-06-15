// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { RecentEmailTable } from './RecentEmailTable';

const msg = {
  id: '1', reference: 'EML-2826-58842', recipientEmail: 'client@example.com', recipientName: 'Jean K.',
  subject: 'Confirmation commande', messageType: 'transactional', messageTypeLabel: 'Transactionnel',
  templateName: 'confirmation_commande', status: 'delivered', statusLabel: 'Livré', openRate: 100, clickRate: 0,
  sentAt: '2026-06-09T10:00:00Z',
};

describe('RecentEmailTable', () => {
  it('renders empty state', () => {
    const { container, unmount } = renderComponent(<RecentEmailTable messages={[]} onOpen={vi.fn()} onAction={vi.fn()} />);
    expect(byText(container, 'Aucun email trouvé.')).not.toBeNull();
    unmount();
  });

  it('renders message row', () => {
    const { container, unmount } = renderComponent(<RecentEmailTable messages={[msg]} onOpen={vi.fn()} onAction={vi.fn()} />);
    expect(byText(container, 'Envois récents')).not.toBeNull();
    expect(container.textContent).toContain('EML-2826-58842');
    unmount();
  });
});
