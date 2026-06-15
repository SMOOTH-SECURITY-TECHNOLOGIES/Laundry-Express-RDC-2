// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { ConversationTable } from './ConversationTable';

const convs = [{ id: '1', clientName: 'Marie Kabila', phone: '+243 81 234 5678', lastMessage: 'Bonjour', channel: 'whatsapp', assignedTo: 'Sophie', status: 'open' as const, statusLabel: 'Ouvert', waitTimeSec: 120, waitTimeLabel: '2 min' }];

describe('ConversationTable', () => {
  it('renders conversations', () => {
    const { container, unmount } = renderComponent(<ConversationTable conversations={convs} onOpen={vi.fn()} onAction={vi.fn()} />);
    expect(byText(container, 'Marie Kabila')).not.toBeNull();
    unmount();
  });

  it('shows empty state', () => {
    const { container, unmount } = renderComponent(<ConversationTable conversations={[]} onOpen={vi.fn()} onAction={vi.fn()} />);
    expect(byText(container, 'Aucune conversation trouvée')).not.toBeNull();
    unmount();
  });
});
