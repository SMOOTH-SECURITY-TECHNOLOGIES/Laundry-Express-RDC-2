// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../hooks/useRbacCenter', () => ({
  default: () => ({
    kpis: {
      rolesCount: 12, rolesChange: 9.1, rolesSparkline: [],
      permissionsCount: 164, permissionsChange: 6.7, permissionsSparkline: [],
      affectedUsers: 86, affectedUsersChange: 12.4, affectedUsersSparkline: [],
      superAdmins: 4, superAdminsChange: 0,
      changes30d: 27, changes30dChange: 18.2, changes30dSparkline: [],
      securityAlerts: 3, securityAlertsChange: 50, securityAlertsSparkline: [],
    },
    roles: [{ id: '1', slug: 'admin', name: 'Admin', userCount: 18, permissionsCount: 120, isSystem: true, status: 'active' }],
    permissions: [], matrix: [], matrixModules: [], matrixActions: [],
    userAssignments: [], userOverrides: [], temporaryPermissions: [],
    auditLogs: [], history: [], riskAlerts: [], securityPolicies: [], tenants: [],
    roleDistribution: [], analytics: [], readOnly: true, loading: false, error: null, refresh: vi.fn(),
  }),
}));

import { PermissionsControlCenter } from './PermissionsControlCenter';

describe('PermissionsControlCenter', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders RBAC header and KPIs', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<PermissionsControlCenter />); });
    expect(container.textContent).toContain('Permissions');
    expect(container.textContent).toContain('164');
    await act(async () => root.unmount());
    container.remove();
  });
});
