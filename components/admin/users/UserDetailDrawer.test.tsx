// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { UserDetailDrawer } from './UserDetailDrawer';
import { renderComponent, byText } from './test-utils';

const user = {
  id: '1', name: 'Jean Dupont', email: 'jean@test.com', phone: '+243',
  role: 'customer', status: 'active', loyaltyPoints: 1200, referralCode: 'REF1',
  isEmailVerified: true, isPhoneVerified: true, is2faEnabled: false,
  createdAt: '2026-01-01', lastLoginAt: null, ordersCount: 5, totalSpent: 2500, referralsCount: 2,
};

describe('UserDetailDrawer', () => {
  it('renders user profile', () => {
    const { container, unmount } = renderComponent(
      <UserDetailDrawer user={user} onClose={vi.fn()} onSecurity={vi.fn()} />,
    );
    expect(byText(container, 'Jean Dupont')).not.toBeNull();
    expect(byText(container, 'Commandes')).not.toBeNull();
    unmount();
  });
});
