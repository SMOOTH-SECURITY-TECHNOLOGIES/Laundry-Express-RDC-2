// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { SupportKpiCards } from './SupportKpiCards';
import { renderComponent, byText } from './test-utils';

describe('SupportKpiCards', () => {
  it('renders 8 KPI cards', () => {
    const { container, unmount } = renderComponent(
      <SupportKpiCards kpis={{
        openTickets: 24, openTicketsChange: -14.3, openTicketsSparkline: [],
        newTickets: 12, newTicketsChange: 20, newTicketsSparkline: [],
        waitingClient: 8, waitingClientChange: -11.1, waitingClientSparkline: [],
        waitingSupport: 6, waitingSupportChange: -25, waitingSupportSparkline: [],
        slaCompliance: 92, slaComplianceChange: 2.2, slaComplianceSparkline: [],
        criticalTickets: 3, criticalTicketsChange: 50, criticalTicketsSparkline: [],
        satisfaction: 4.6, satisfactionChange: 0.3, satisfactionSparkline: [],
        avgResponseMinutes: 18, avgResponseChange: -4, avgResponseSparkline: [],
      }} />,
    );
    expect(byText(container, 'Tickets ouverts')).not.toBeNull();
    expect(byText(container, 'SLA respecté')).not.toBeNull();
    unmount();
  });
});
