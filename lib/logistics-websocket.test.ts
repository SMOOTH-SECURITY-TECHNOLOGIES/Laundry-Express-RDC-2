// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  connectLogisticsWebSocket,
  disconnectLogisticsWebSocket,
  subscribeLogisticsWs,
  isLogisticsWsConnected,
} from './logistics-websocket';

describe('logistics-websocket', () => {
  afterEach(() => {
    disconnectLogisticsWebSocket();
    vi.useRealTimers();
  });

  it('starts simulated feed when no WS URL is configured', () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    connectLogisticsWebSocket();
    subscribeLogisticsWs(listener);

    expect(isLogisticsWsConnected()).toBe(true);
    vi.advanceTimersByTime(20000);
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].channel).toBeTruthy();
  });

  it('uses reference counting for shared connections', () => {
    connectLogisticsWebSocket();
    connectLogisticsWebSocket();
    disconnectLogisticsWebSocket();
    expect(isLogisticsWsConnected()).toBe(true);
    disconnectLogisticsWebSocket();
    expect(isLogisticsWsConnected()).toBe(false);
  });
});
