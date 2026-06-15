import { useEffect, useState } from 'react';
import { realApi } from '../services/real-api';
import { features } from '../config/features';

export interface LoyaltyHistoryEntry {
  id: string;
  entryType: string;
  pointsDelta: number;
  balanceAfter: number;
  orderId?: string | null;
  description: string;
  createdAt?: string | null;
}

export function useMyLoyaltyHistory(enabled: boolean) {
  const [entries, setEntries] = useState<LoyaltyHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || features.useMockApi) {
      setEntries([]);
      setTotal(0);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    realApi
      .getMyLoyaltyHistory(50)
      .then((data) => {
        if (cancelled) return;
        setEntries(
          (data.entries || []).map((entry) => ({
            id: entry.id,
            entryType: entry.entry_type,
            pointsDelta: entry.points_delta,
            balanceAfter: entry.balance_after,
            orderId: entry.order_id,
            description: entry.description,
            createdAt: entry.created_at,
          })),
        );
        setTotal(data.total || 0);
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { entries, total, isLoading };
}
