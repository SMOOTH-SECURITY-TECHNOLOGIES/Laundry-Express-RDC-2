import { features } from '../../config/features';
import { realApi, type BackendUsersDashboardResponse } from '../../services/real-api';
import type { UserDetail, UserSecurityDetail, UsersDashboardSummary } from './users-types';

export const USERS_WRITE_ENABLED = import.meta.env.VITE_USERS_WRITE_ENABLED !== 'false';

let cached: UsersDashboardSummary | null = null;
let promise: Promise<UsersDashboardSummary> | null = null;
let cachedDays = 7;

export function invalidateUsersCache(): void {
  cached = null;
  promise = null;
}

function map(raw: BackendUsersDashboardResponse): UsersDashboardSummary {
  return {
    kpis: {
      totalUsers: raw.kpis.total_users, totalUsersChange: raw.kpis.total_users_change,
      totalUsersSparkline: raw.kpis.total_users_sparkline ?? [],
      newSignups: raw.kpis.new_signups, newSignupsChange: raw.kpis.new_signups_change,
      newSignupsSparkline: raw.kpis.new_signups_sparkline ?? [],
      activeUsers: raw.kpis.active_users, activeUsersChange: raw.kpis.active_users_change,
      activeUsersSparkline: raw.kpis.active_users_sparkline ?? [],
      inactiveUsers: raw.kpis.inactive_users, inactiveUsersChange: raw.kpis.inactive_users_change,
      inactiveUsersSparkline: raw.kpis.inactive_users_sparkline ?? [],
      partners: raw.kpis.partners, partnersChange: raw.kpis.partners_change,
      partnersSparkline: raw.kpis.partners_sparkline ?? [],
      drivers: raw.kpis.drivers, driversChange: raw.kpis.drivers_change,
      driversSparkline: raw.kpis.drivers_sparkline ?? [],
    },
    users: raw.users.map((u) => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      role: u.role as UsersDashboardSummary['users'][0]['role'],
      roleLabel: u.role_label, status: u.status as UsersDashboardSummary['users'][0]['status'],
      statusLabel: u.status_label, loyaltyPoints: u.loyalty_points,
      referralCode: u.referral_code, createdAt: u.created_at, lastLoginAt: u.last_login_at,
    })),
    roleDistribution: raw.role_distribution.map((r) => ({ role: r.role, count: r.count, percent: r.percent, color: r.color })),
    statusBreakdown: raw.status_breakdown.map((s) => ({ status: s.status, count: s.count, percent: s.percent })),
    growth: raw.growth.map((g) => ({ date: g.date, newSignups: g.new_signups, activeUsers: g.active_users })),
    acquisitionSources: raw.acquisition_sources.map((a) => ({ source: a.source, count: a.count, percent: a.percent, color: a.color })),
    topZones: raw.top_zones.map((z) => ({ zone: z.zone, users: z.users, percent: z.percent })),
    recentActivity: raw.recent_activity.map((a) => ({
      id: a.id, userName: a.user_name, action: a.action, detail: a.detail, device: a.device, date: a.date,
    })),
    devices: raw.devices.map((d) => ({ device: d.device, count: d.count, percent: d.percent, color: d.color })),
    loyalty: {
      usersWithPoints: raw.loyalty.users_with_points,
      usersWithPointsPercent: raw.loyalty.users_with_points_percent,
      totalPoints: raw.loyalty.total_points,
      averageBalance: raw.loyalty.average_balance,
      topHolders: raw.loyalty.top_holders ?? [],
    },
    security: {
      twoFaEnabledPercent: raw.security.two_fa_enabled_percent,
      verifiedAccountsPercent: raw.security.verified_accounts_percent,
      unverifiedAccountsPercent: raw.security.unverified_accounts_percent,
      suspiciousLogins: raw.security.suspicious_logins,
    },
    watchlist: raw.watchlist.map((w) => ({ id: w.id, message: w.message, count: w.count, severity: w.severity as 'low' | 'medium' | 'high' })),
    topUsers: raw.top_users.map((t) => ({
      userId: t.user_id, name: t.name, orders: t.orders, revenue: t.revenue,
      loyaltyPoints: t.loyalty_points, lastActivity: t.last_activity,
    })),
    segments: raw.segments.map((s) => ({ segment: s.segment, segmentKey: s.segment_key, count: s.count, percent: s.percent })),
    valueUsers: raw.value_users.map((v) => ({
      userId: v.user_id, name: v.name, clv: v.clv, avgBasket: v.avg_basket,
      frequency: v.frequency, lastOrder: v.last_order,
    })),
    source: raw.source,
  };
}

export async function fetchUsersBundle(days = 7): Promise<UsersDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour le centre utilisateurs.');
  if (cached && cachedDays === days) return cached;
  if (promise && cachedDays === days) return promise;
  cachedDays = days;
  promise = realApi.getUsersDashboard(days).then((raw) => {
    cached = map(raw);
    promise = null;
    return cached;
  });
  return promise;
}

export async function fetchUserDetail(id: string): Promise<UserDetail> {
  const raw = await realApi.getUserDetail(id);
  return {
    id: raw.id, name: raw.name, email: raw.email, phone: raw.phone,
    role: raw.role, status: raw.status, loyaltyPoints: raw.loyalty_points,
    referralCode: raw.referral_code, isEmailVerified: raw.is_email_verified,
    isPhoneVerified: raw.is_phone_verified, is2faEnabled: raw.is_2fa_enabled,
    createdAt: raw.created_at, lastLoginAt: raw.last_login_at,
    ordersCount: raw.orders_count, totalSpent: raw.total_spent, referralsCount: raw.referrals_count,
  };
}

export async function fetchUserSecurity(id: string): Promise<UserSecurityDetail> {
  const raw = await realApi.getUserSecurity(id);
  return {
    userId: raw.user_id, twoFaEnabled: raw.two_fa_enabled,
    suspiciousLogins: raw.suspicious_logins,
    recentLogins: raw.recent_logins ?? [],
    activeSessions: raw.active_sessions,
  };
}

export async function exportUsers(data: { format: string; scope: string }) {
  if (!USERS_WRITE_ENABLED) throw new Error('Export désactivé (mode lecture seule).');
  return realApi.exportUsers(data);
}

export async function suspendUser(userId: string) {
  if (!USERS_WRITE_ENABLED) throw new Error('Action désactivée (mode lecture seule).');
  return realApi.suspendUser(userId);
}

export async function reactivateUser(userId: string) {
  if (!USERS_WRITE_ENABLED) throw new Error('Action désactivée (mode lecture seule).');
  return realApi.reactivateUser(userId);
}

export function trackUserEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'users', ...detail } }));
}
