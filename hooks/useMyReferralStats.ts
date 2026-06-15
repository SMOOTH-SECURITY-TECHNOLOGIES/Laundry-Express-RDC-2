import { useEffect, useState } from 'react';
import { realApi } from '../services/real-api';
import { features } from '../config/features';

export interface MyReferralStats {
  referralCode: string | null;
  referredUsersCount: number;
  completedConversions: number;
  totalBonusPoints: number;
}

const EMPTY: MyReferralStats = {
  referralCode: null,
  referredUsersCount: 0,
  completedConversions: 0,
  totalBonusPoints: 0,
};

export function useMyReferralStats(enabled: boolean) {
  const [stats, setStats] = useState<MyReferralStats>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || features.useMockApi) {
      setStats(EMPTY);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    realApi
      .getMyReferralStats()
      .then((data) => {
        if (cancelled) return;
        setStats({
          referralCode: data.referral_code,
          referredUsersCount: data.referred_users_count,
          completedConversions: data.completed_conversions,
          totalBonusPoints: data.total_bonus_points,
        });
      })
      .catch(() => {
        if (!cancelled) setStats(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { stats, isLoading };
}
