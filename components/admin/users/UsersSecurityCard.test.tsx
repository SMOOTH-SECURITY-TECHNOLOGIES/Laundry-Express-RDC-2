// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { UserSecurityCard } from './UserSecurityCard';
import { renderComponent, byText } from './test-utils';

describe('UsersSecurityCard', () => {
  it('renders security metrics', () => {
    const { container, unmount } = renderComponent(
      <UserSecurityCard security={{ twoFaEnabledPercent: 32, verifiedAccountsPercent: 72, unverifiedAccountsPercent: 28, suspiciousLogins: 2 }} />,
    );
    expect(byText(container, 'Sécurité des comptes')).not.toBeNull();
    expect(byText(container, '32%')).not.toBeNull();
    unmount();
  });
});
