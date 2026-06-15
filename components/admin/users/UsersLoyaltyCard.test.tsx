// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { UsersLoyaltyCard } from './UsersLoyaltyCard';
import { renderComponent, byText } from './test-utils';

describe('UsersLoyaltyCard', () => {
  it('renders loyalty summary', () => {
    const { container, unmount } = renderComponent(
      <UsersLoyaltyCard loyalty={{ usersWithPoints: 14, usersWithPointsPercent: 56, totalPoints: 48200, averageBalance: 3443, topHolders: [{ name: 'Jean', points: 5000 }] }} />,
    );
    expect(byText(container, 'Utilisateurs fidélité')).not.toBeNull();
    expect(byText(container, 'Points totaux')).not.toBeNull();
    unmount();
  });
});
