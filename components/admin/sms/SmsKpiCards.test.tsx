// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { SmsKpiCards } from './SmsKpiCards';

const kpis = {
  sentToday: 24580, sentTodayChange: 18.6, sentTodaySparkline: [],
  deliveryRate: 97.8, deliveryRateChange: 2.2, deliveryRateSparkline: [],
  failureRate: 2.2, failureRateChange: -0.8, failureRateSparkline: [],
  costToday: 42.35, costTodayChange: -5.2, costTodaySparkline: [],
  creditsAvailable: 125680, creditsChange: 12.4, creditsSparkline: [],
  activeCampaigns: 8, activeCampaignsChange: 0,
  otpSuccessRate: 89.6, otpSuccessChange: 9.1, otpSuccessSparkline: [],
  monthlyVolume: 685420, monthlyVolumeChange: 21.3, monthlyVolumeSparkline: [],
};

describe('SmsKpiCards', () => {
  it('renders sent today KPI', () => {
    const { container, unmount } = renderComponent(<SmsKpiCards kpis={kpis} />);
    expect(byText(container, "SMS envoyés aujourd'hui")).not.toBeNull();
    expect(container.textContent?.replace(/[\s\u00a0\u202f]/g, '')).toContain('24580');
    unmount();
  });
});
