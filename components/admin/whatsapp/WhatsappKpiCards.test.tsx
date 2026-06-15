// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { WhatsappKpiCards } from './WhatsappKpiCards';

const kpis = {
  openConversations: 1284, openConversationsChange: 12.5, openConversationsSparkline: [1100, 1284],
  messagesToday: 12450, messagesTodayChange: 18.7, messagesTodaySparkline: [],
  responseRate: 94.6, responseRateChange: 4.2, responseRateSparkline: [],
  avgResponseTime: '2 min 14 sec', avgResponseTimeChange: '-15 sec', avgResponseTimeSparkline: [],
  activeTemplates: 36, activeTemplatesChange: 3, activeTemplatesSparkline: [],
  costToday: 42.8, costTodayChange: 5.3, costTodaySparkline: [],
  aiConversationsPct: 72, aiConversationsChange: 8, aiConversationsSparkline: [],
  satisfaction: 4.8, satisfactionChange: 0.2, satisfactionSparkline: [],
};

describe('WhatsappKpiCards', () => {
  it('renders open conversations KPI', () => {
    const { container, unmount } = renderComponent(<WhatsappKpiCards kpis={kpis} />);
    expect(byText(container, 'Conversations ouvertes')).not.toBeNull();
    expect(container.textContent?.replace(/[\s\u00a0\u202f]/g, '')).toContain('1284');
    unmount();
  });
});
