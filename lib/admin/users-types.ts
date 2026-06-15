export type UserRole = 'customer' | 'partner_owner' | 'partner_staff' | 'driver' | 'admin' | 'super_admin' | 'logistics_manager';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface UserKpis {
  totalUsers: number; totalUsersChange: number; totalUsersSparkline: number[];
  newSignups: number; newSignupsChange: number; newSignupsSparkline: number[];
  activeUsers: number; activeUsersChange: number; activeUsersSparkline: number[];
  inactiveUsers: number; inactiveUsersChange: number; inactiveUsersSparkline: number[];
  partners: number; partnersChange: number; partnersSparkline: number[];
  drivers: number; driversChange: number; driversSparkline: number[];
}

export interface UserSummary {
  id: string; name: string; email: string; phone: string;
  role: UserRole; roleLabel: string; status: UserStatus; statusLabel: string;
  loyaltyPoints: number; referralCode: string | null;
  createdAt: string | null; lastLoginAt: string | null;
}

export interface RoleDistribution { role: string; count: number; percent: number; color: string }
export interface StatusBreakdown { status: string; count: number; percent: number }
export interface GrowthPoint { date: string; newSignups: number; activeUsers: number }
export interface AcquisitionSource { source: string; count: number; percent: number; color: string }
export interface TopZone { zone: string; users: number; percent: number }
export interface UserActivity { id: string; userName: string; action: string; detail: string; device: string; date: string | null }
export interface DeviceBreakdown { device: string; count: number; percent: number; color: string }
export interface LoyaltySummary {
  usersWithPoints: number; usersWithPointsPercent: number;
  totalPoints: number; averageBalance: number;
  topHolders: Array<{ name: string; points: number }>;
}
export interface SecuritySummary {
  twoFaEnabledPercent: number; verifiedAccountsPercent: number;
  unverifiedAccountsPercent: number; suspiciousLogins: number;
}
export interface WatchlistItem { id: string; message: string; count: number; severity: 'low' | 'medium' | 'high' }
export interface TopUser {
  userId: string; name: string; orders: number; revenue: number;
  loyaltyPoints: number; lastActivity: string | null;
}
export interface UserSegment { segment: string; segmentKey: string; count: number; percent: number }
export interface ValueUser {
  userId: string; name: string; clv: number; avgBasket: number;
  frequency: number; lastOrder: string | null;
}
export interface UserDetail {
  id: string; name: string; email: string; phone: string;
  role: string; status: string; loyaltyPoints: number; referralCode: string | null;
  isEmailVerified: boolean; isPhoneVerified: boolean; is2faEnabled: boolean;
  createdAt: string | null; lastLoginAt: string | null;
  ordersCount: number; totalSpent: number; referralsCount: number;
}
export interface UserSecurityDetail {
  userId: string; twoFaEnabled: boolean; suspiciousLogins: number;
  recentLogins: Array<{ ip: string; date: string | null }>; activeSessions: number;
}

export interface UsersDashboardSummary {
  kpis: UserKpis;
  users: UserSummary[];
  roleDistribution: RoleDistribution[];
  statusBreakdown: StatusBreakdown[];
  growth: GrowthPoint[];
  acquisitionSources: AcquisitionSource[];
  topZones: TopZone[];
  recentActivity: UserActivity[];
  devices: DeviceBreakdown[];
  loyalty: LoyaltySummary;
  security: SecuritySummary;
  watchlist: WatchlistItem[];
  topUsers: TopUser[];
  segments: UserSegment[];
  valueUsers: ValueUser[];
  source: string;
}
