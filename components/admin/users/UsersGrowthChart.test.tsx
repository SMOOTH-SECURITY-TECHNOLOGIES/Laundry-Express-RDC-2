// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { UsersGrowthChart } from './UsersGrowthChart';
import { renderComponent, byText } from './test-utils';

describe('UsersGrowthChart', () => {
  it('renders growth chart title', () => {
    const { container, unmount } = renderComponent(
      <UsersGrowthChart data={[{ date: '2026-06-01', newSignups: 2, activeUsers: 5 }]} days={7} onDaysChange={vi.fn()} />,
    );
    expect(byText(container, 'Évolution des inscriptions')).not.toBeNull();
    unmount();
  });
});
