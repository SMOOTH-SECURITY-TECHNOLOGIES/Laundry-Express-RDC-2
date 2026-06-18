// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { byText, renderComponent } from '../../order-marketplace/test-utils';
import { PilotDashboard } from '../PilotDashboard';
import { pilotResetMetrics, pilotTrackMissionStart, pilotTrackDelivery } from '../../../lib/pilot-metrics-store';

const viewports = [360, 390, 430] as const;

describe('PilotDashboard Mobile', () => {
  beforeEach(() => {
    pilotResetMetrics();
  });

  viewports.forEach((width) => {
    it(`renders pilot KPIs at ${width}px`, () => {
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
      pilotTrackMissionStart('mission-1');
      pilotTrackDelivery('mission-1');
      const view = renderComponent(<PilotDashboard />);
      expect(byText(view.container, 'Pilote')).not.toBeNull();
      expect(byText(view.container, 'Assignation')).not.toBeNull();
      expect(byText(view.container, 'Résumé missions')).not.toBeNull();
      view.unmount();
    });
  });

  it('reflects tracked mission counts', () => {
    pilotTrackMissionStart('m-1');
    pilotTrackDelivery('m-1');
    const view = renderComponent(<PilotDashboard />);
    expect(byText(view.container, 'Terminées')).not.toBeNull();
    view.unmount();
  });
});
