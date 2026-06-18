import { describe, expect, it } from 'vitest';
import {
  appendAuthToken,
  buildWsUrlFromApiBase,
  httpBaseToWsBase,
  resolveLogisticsWsUrl,
} from './ws-url';

describe('ws-url', () => {
  it('converts https to wss', () => {
    expect(httpBaseToWsBase('https://staging-api.example.com/api/v1')).toBe(
      'wss://staging-api.example.com/api/v1',
    );
  });

  it('builds logistics live URL for staging API base', () => {
    expect(
      buildWsUrlFromApiBase('https://staging-api.example.com/api/v1', '/logistics/live', 'jwt-abc'),
    ).toBe('wss://staging-api.example.com/api/v1/logistics/live?token=jwt-abc');
  });

  it('appends token only once', () => {
    expect(appendAuthToken('wss://api.test/live?token=abc', 'xyz')).toBe('wss://api.test/live?token=abc');
  });

  it('prefers explicit logistics WS URL in staging', () => {
    const url = resolveLogisticsWsUrl({
      explicitUrl: 'wss://staging-api.example.com/api/v1/logistics/live',
      apiBaseUrl: 'https://staging-api.example.com/api/v1',
      token: 'jwt-abc',
      mode: 'production',
      windowAvailable: true,
    });
    expect(url).toBe('wss://staging-api.example.com/api/v1/logistics/live?token=jwt-abc');
  });

  it('derives wss from absolute https API base when explicit URL is absent', () => {
    const url = resolveLogisticsWsUrl({
      apiBaseUrl: 'https://staging-api.example.com/api/v1',
      token: 'jwt-abc',
      mode: 'production',
      windowAvailable: true,
    });
    expect(url).toBe('wss://staging-api.example.com/api/v1/logistics/live?token=jwt-abc');
  });
});
