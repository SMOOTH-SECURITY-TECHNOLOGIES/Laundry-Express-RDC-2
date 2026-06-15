// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../hooks/useAdminMgmtCenter', () => ({
  default: () => ({
    kpis: { totalAdmins: 24, totalAdminsChange: 8, totalAdminsSparkline: [], superAdmins: 4, superAdminsChange: 0, activeAdmins: 15, activeAdminsChange: 15.4, rolesCount: 7, rolesChange: 0, activeSessions: 19, activeSessionsChange: 11.8, pendingInvitations: 3, pendingInvitationsChange: 0 },
    admins: [], roles: [], rbacMatrix: [], rbacResources: [], invitations: [], sessions: [],
    security: { activeSessions: 19, logins24h: 42, loginFailures: 3, twoFaPct: 68 },
    activityLogs: [], auditLogs: [], securityAlerts: [], roleDistribution: [],
    loading: false, error: null, refresh: vi.fn(),
  }),
}));

import { AdminManagementControlCenter } from './AdminManagementControlCenter';

describe('AdminManagementControlCenter', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders Gestion Admin header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<AdminManagementControlCenter />); });
    expect(container.textContent).toContain('Gestion Admin');
    await act(async () => root.unmount());
    container.remove();
  });
});
