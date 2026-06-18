// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeTracking } from '../useRealTimeTracking';

const mocks = vi.hoisted(() => ({
  getLogisticsTasks: vi.fn(async () => ({
    tasks: [{ id: 't-1', status: 'in_progress', order_number: 'LX-1' }],
    total: 1,
    page: 1,
    page_size: 100,
  })),
  getLogisticsDrivers: vi.fn(async () => ({
    drivers: [{ id: 'd-1', is_available: true, status: 'active' }],
    total: 1,
    page: 1,
    page_size: 100,
  })),
}));

vi.mock('../../services/real-api', () => ({
  realApi: {
    getLogisticsTasks: mocks.getLogisticsTasks,
    getLogisticsDrivers: mocks.getLogisticsDrivers,
  },
}));

vi.mock('../../lib/logistics-websocket', () => ({
  connectLogisticsWebSocket: vi.fn(),
  disconnectLogisticsWebSocket: vi.fn(),
  subscribeLogisticsWs: vi.fn(() => () => {}),
}));

describe('useRealTimeTracking', () => {
  beforeEach(() => {
    mocks.getLogisticsTasks.mockClear();
    mocks.getLogisticsDrivers.mockClear();
  });

  it('loads tasks and drivers from the API', async () => {
    const { result } = renderHook(() => useRealTimeTracking({ enabled: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.tasks).toHaveLength(1);
    expect(result.current.data.drivers).toHaveLength(1);
    expect(result.current.mode).toBe('backend');
    expect(mocks.getLogisticsTasks).toHaveBeenCalled();
    expect(mocks.getLogisticsDrivers).toHaveBeenCalled();
  });

  it('refresh triggers another fetch', async () => {
    const { result } = renderHook(() => useRealTimeTracking({ enabled: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mocks.getLogisticsTasks.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('enters degraded mode when API fails', async () => {
    mocks.getLogisticsTasks.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useRealTimeTracking({ enabled: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mode).toBe('degraded');
    expect(result.current.error).toBeTruthy();
  });
});
