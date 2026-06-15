import { useState, useEffect, useCallback } from 'react';
import { Order, Partner } from '../types';
import { realApi } from '../services/real-api';
import { mapBackendOrderResponseToFrontend, isLocalMockOrderId } from '../utils/order-mappers';
import { features } from '../config/features';

const POLL_INTERVAL_MS = 10_000;

interface UseOrderTrackingOptions {
  orderId: string | null;
  partners?: Partner[];
  fallbackOrder?: Order | null;
  enabled?: boolean;
}

export function useOrderTracking({
  orderId,
  partners = [],
  fallbackOrder = null,
  enabled = true,
}: UseOrderTrackingOptions) {
  const [order, setOrder] = useState<Order | null>(fallbackOrder);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId || !enabled) return;
    if (features.useMockApi || isLocalMockOrderId(orderId)) {
      if (fallbackOrder) setOrder(fallbackOrder);
      return;
    }

    setIsPolling(true);
    try {
      const backendOrder = await realApi.getOrder(orderId);
      setOrder(mapBackendOrderResponseToFrontend(backendOrder, partners));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger la commande';
      setError(message);
      if (fallbackOrder) setOrder(fallbackOrder);
    } finally {
      setIsPolling(false);
    }
  }, [orderId, enabled, partners, fallbackOrder]);

  useEffect(() => {
    if (!orderId || !enabled) {
      setOrder(fallbackOrder);
      return;
    }

    if (features.useMockApi || isLocalMockOrderId(orderId)) {
      setOrder(fallbackOrder);
      return;
    }

    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      await fetchOrder();
    };

    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [orderId, enabled, fetchOrder, fallbackOrder]);

  return { order, isPolling, error, refresh: fetchOrder };
}
