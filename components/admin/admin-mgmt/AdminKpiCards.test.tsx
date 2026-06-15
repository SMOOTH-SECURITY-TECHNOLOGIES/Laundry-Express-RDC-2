// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { AdminKpiCards } from './AdminKpiCards';

const kpis = {
  totalAdmins: 24, totalAdminsChange: 8, totalAdminsSparkline: [],
  superAdmins: 4, superAdminsChange: 0, activeAdmins: 15, activeAdminsChange: 15.4,
  rolesCount: 7, rolesChange: 0, activeSessions: 19, activeSessionsChange: 11.8,
  pendingInvitations: 3, pendingInvitationsChange: 0,
};

describe('AdminKpiCards', () => {
  it('renders total admins KPI', () => {
    const { container, unmount } = renderComponent(<AdminKpiCards kpis={kpis} />);
    expect(byText(container, 'Total admins')).not.toBeNull();
    expect(container.textContent).toContain('24');
    unmount();
  });
});
