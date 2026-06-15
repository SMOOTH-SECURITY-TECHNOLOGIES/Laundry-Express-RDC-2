// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { UsersTable } from './UsersTable';
import { renderComponent, byText } from './test-utils';

const user = {
  id: '1', name: 'Marie Kabila', email: 'marie@test.com', phone: '+243900',
  role: 'customer' as const, roleLabel: 'Client', status: 'active' as const, statusLabel: 'Actif',
  loyaltyPoints: 500, referralCode: null, createdAt: '2026-06-01', lastLoginAt: null,
};

describe('UsersTable', () => {
  it('renders user rows', () => {
    const { container, unmount } = renderComponent(
      <UsersTable users={[user]} onView={vi.fn()} onSecurity={vi.fn()} />,
    );
    expect(byText(container, 'Marie Kabila')).not.toBeNull();
    expect(byText(container, 'Client')).not.toBeNull();
    unmount();
  });
});
