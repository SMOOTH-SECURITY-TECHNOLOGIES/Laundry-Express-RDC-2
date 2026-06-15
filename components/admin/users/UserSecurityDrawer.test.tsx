// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { UserSecurityDrawer } from './UserSecurityDrawer';
import { renderComponent, byText } from './test-utils';

const user = {
  id: '1', name: 'Jean', email: 'jean@test.com', phone: '+243',
  role: 'customer', status: 'active', loyaltyPoints: 0, referralCode: null,
  isEmailVerified: true, isPhoneVerified: false, is2faEnabled: true,
  createdAt: null, lastLoginAt: null, ordersCount: 0, totalSpent: 0, referralsCount: 0,
};

describe('UserSecurityDrawer', () => {
  it('renders security panel', () => {
    const { container, unmount } = renderComponent(
      <UserSecurityDrawer
        user={user}
        security={{ userId: '1', twoFaEnabled: true, suspiciousLogins: 0, recentLogins: [{ ip: '192.168.1.1', date: '2026-06-07' }], activeSessions: 1 }}
        onClose={vi.fn()}
      />,
    );
    expect(byText(container, 'Sécurité')).not.toBeNull();
    expect(byText(container, '192.168.1.1')).not.toBeNull();
    unmount();
  });
});
