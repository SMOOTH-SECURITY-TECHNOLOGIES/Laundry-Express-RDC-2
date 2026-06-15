import { useCallback, useEffect, useState } from 'react';
import { realApi, PublicReview } from '../services/real-api';
import { features } from '../config/features';

export function useMyReviews(enabled = true) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || features.useMockApi) {
      setReviews([]);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await realApi.getMyReviews();
      setReviews(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger vos avis');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reviews, isLoading, error, refresh };
}
