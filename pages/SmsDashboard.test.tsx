// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../hooks/useSmsCenter', () => ({
  default: () => ({
    kpis: {
      sentToday: 24580, sentTodayChange: 18.6, sentTodaySparkline: [],
      deliveryRate: 97.8, deliveryRateChange: 2.2, deliveryRateSparkline: [],
      failureRate: 2.2, failureRateChange: -0.8, failureRateSparkline: [],
      costToday: 42.35, costTodayChange: -5.2, costTodaySparkline: [],
      creditsAvailable: 125680, creditsChange: 12.4, creditsSparkline: [],
      activeCampaigns: 8, activeCampaignsChange: 0,
      otpSuccessRate: 89.6, otpSuccessChange: 9.1, otpSuccessSparkline: [],
      monthlyVolume: 685420, monthlyVolumeChange: 21.3, monthlyVolumeSparkline: [],
    },
    operatorDistribution: [], messages: [], operatorPerformance: [], deliveryStatus: [],
    campaigns: [], templates: [], senders: [],
    credits: { currentCredits: 125680, monthlyConsumption: 685420, avgCostPerSms: 0.021, autoRecharge: true, alertThreshold: 500 },
    creditLedger: [], otpKpis: { sent: 4200, validated: 3760, successRate: 89.6, avgValidationSec: 42 },
    otpRecords: [], alerts: [], analytics: [], activities: [], webhooks: [], settings: { autoRecharge: true, alertThreshold: 500, defaultSender: 'LAUNDRY', providers: [] },
    logs: [], loading: false, error: null, refresh: vi.fn(), handleExport: vi.fn(), handleSend: vi.fn(),
  }),
}));

import { SmsControlCenter } from './SmsControlCenter';

describe('SmsControlCenter', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders SMS Center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<SmsControlCenter />); });
    expect(container.textContent).toContain('SMS Center');
    await act(async () => root.unmount());
    container.remove();
  });
});
