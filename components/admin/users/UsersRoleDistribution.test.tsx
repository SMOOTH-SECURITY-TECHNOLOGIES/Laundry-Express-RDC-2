// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { UsersRoleDistribution } from './UsersRoleDistribution';
import { renderComponent, byText } from './test-utils';

describe('UsersRoleDistribution', () => {
  it('renders role breakdown', () => {
    const { container, unmount } = renderComponent(
      <UsersRoleDistribution data={[{ role: 'Client', count: 12, percent: 48, color: '#3B82F6' }]} total={25} />,
    );
    expect(byText(container, 'Répartition par rôle')).not.toBeNull();
    expect(byText(container, 'Client')).not.toBeNull();
    unmount();
  });
});
