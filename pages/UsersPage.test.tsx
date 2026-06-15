// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const mockBundle = {
  kpis: {
    totalUsers: 25, totalUsersChange: 16.7, totalUsersSparkline: [20, 25],
    newSignups: 12, newSignupsChange: 20, newSignupsSparkline: [10, 12],
    activeUsers: 18, activeUsersChange: 12.5, activeUsersSparkline: [16, 18],
    inactiveUsers: 7, inactiveUsersChange: -5.6, inactiveUsersSparkline: [8, 7],
    partners: 4, partnersChange: 0, partnersSparkline: [4, 4],
    drivers: 5, driversChange: 25, driversSparkline: [4, 5],
  },
  users: [{ id: '1', name: 'Jean Dupont', email: 'jean@test.com', phone: '+243', role: 'customer' as const, roleLabel: 'Client', status: 'active' as const, statusLabel: 'Actif', loyaltyPoints: 1200, referralCode: 'ABC', createdAt: '2026-06-01', lastLoginAt: null }],
  roleDistribution: [{ role: 'Client', count: 12, percent: 48, color: '#3B82F6' }],
  statusBreakdown: [{ status: 'Actifs', count: 18, percent: 72 }],
  growth: [{ date: '2026-06-01', newSignups: 2, activeUsers: 3 }],
  acquisitionSources: [{ source: 'Application', count: 13, percent: 52, color: '#3B82F6' }],
  topZones: [{ zone: 'Kinshasa / Gombe', users: 8, percent: 32 }],
  recentActivity: [{ id: 'a1', userName: 'Jean', action: 'Connexion', detail: '', device: 'Android', date: '2026-06-07' }],
  devices: [{ device: 'Android', count: 13, percent: 52, color: '#3DDC84' }],
  loyalty: { usersWithPoints: 14, usersWithPointsPercent: 56, totalPoints: 48200, averageBalance: 3443, topHolders: [{ name: 'Jean', points: 5000 }] },
  security: { twoFaEnabledPercent: 32, verifiedAccountsPercent: 72, unverifiedAccountsPercent: 28, suspiciousLogins: 1 },
  watchlist: [{ id: 'w1', message: 'Multi comptes', count: 2, severity: 'high' as const }],
  topUsers: [{ userId: '1', name: 'Jean', orders: 10, revenue: 5000, loyaltyPoints: 1200, lastActivity: null }],
  segments: [{ segment: 'VIP', segmentKey: 'vip', count: 3, percent: 12 }],
  valueUsers: [{ userId: '1', name: 'Jean', clv: 6000, avgBasket: 500, frequency: 2, lastOrder: null }],
  loading: false, error: null, source: 'backend', days: 7,
  refresh: vi.fn(), handleExport: vi.fn(), handleSuspend: vi.fn(), handleReactivate: vi.fn(),
  handleUserDetail: vi.fn(), handleUserSecurity: vi.fn(),
};

vi.mock('../lib/admin/users-api', () => ({ trackUserEvent: vi.fn(), USERS_WRITE_ENABLED: true }));
vi.mock('../hooks/useUsersCenter', () => ({ default: () => mockBundle }));

import { UsersControlCenter } from './UsersControlCenter';

describe('UsersPage', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders User Operations Center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<UsersControlCenter />); });
    expect(container.textContent).toContain('Utilisateurs');
    expect(container.textContent).toContain('Vérité Opérationnelle');
    expect(container.textContent).toContain('Utilisateurs totaux');
    root.unmount();
    container.remove();
  });
});
