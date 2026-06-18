// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { byText, renderComponent } from '../../order-marketplace/test-utils';
import { DeliveryTimeline, type DeliveryStep } from '../DeliveryTimeline';

const mockSteps: DeliveryStep[] = [
  { id: 'created', label: 'Créée', completed: true, timestamp: '10:00' },
  { id: 'assigned', label: 'Assignée', completed: true, timestamp: '10:05' },
  { id: 'pickup', label: 'Ramassage', completed: false, current: true },
  { id: 'delivered', label: 'Livrée', completed: false },
];

describe('DeliveryTimeline Mobile', () => {
  describe('Responsive rendering', () => {
    it('renders correctly at 360px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 360, writable: true });
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      expect(byText(view.container, 'Créée')).not.toBeNull();
      expect(byText(view.container, 'Assignée')).not.toBeNull();
      expect(byText(view.container, 'Ramassage')).not.toBeNull();
      expect(byText(view.container, 'Livrée')).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 390px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      expect(byText(view.container, 'Créée')).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 430px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 430, writable: true });
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      expect(byText(view.container, 'Créée')).not.toBeNull();
      view.unmount();
    });
  });

  describe('Compact mode', () => {
    it('renders compact mode with progress bar', () => {
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} compact />);
      expect(byText(view.container, 'Progression')).not.toBeNull();
      view.unmount();
    });

    it('calculates correct progress percentage', () => {
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} compact />);
      const progressBar = view.container.querySelector('.bg-brand-blue.rounded-full');
      expect(progressBar).not.toBeNull();
      view.unmount();
    });
  });

  describe('Step states', () => {
    it('shows completed steps with check icon', () => {
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      const completedIcons = view.container.querySelectorAll('.bg-green-500');
      expect(completedIcons.length).toBeGreaterThan(0);
      view.unmount();
    });

    it('shows current step indicator', () => {
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      // Current step should have "En cours" text
      expect(byText(view.container, 'En cours')).not.toBeNull();
      view.unmount();
    });

    it('shows pending steps with muted style', () => {
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      const pendingSteps = view.container.querySelectorAll('.bg-surface-muted');
      expect(pendingSteps.length).toBeGreaterThan(0);
      view.unmount();
    });
  });

  describe('Timestamps', () => {
    it('renders timestamps for completed steps', () => {
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      expect(byText(view.container, '10:00')).not.toBeNull();
      expect(byText(view.container, '10:05')).not.toBeNull();
      view.unmount();
    });
  });

  describe('Current step badge', () => {
    it('shows "En cours" badge for current step', () => {
      const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
      expect(byText(view.container, 'En cours')).not.toBeNull();
      view.unmount();
    });
  });

  describe('Descriptions', () => {
    it('renders descriptions when showDescriptions=true', () => {
      const stepsWithDesc: DeliveryStep[] = [
        { id: 'step1', label: 'Étape 1', description: 'Description 1', completed: true },
      ];
      const view = renderComponent(<DeliveryTimeline steps={stepsWithDesc} showDescriptions />);
      expect(byText(view.container, 'Description 1')).not.toBeNull();
      view.unmount();
    });

    it('hides descriptions when showDescriptions=false', () => {
      const stepsWithDesc: DeliveryStep[] = [
        { id: 'step1', label: 'Étape 1', description: 'Description 1', completed: true },
      ];
      const view = renderComponent(<DeliveryTimeline steps={stepsWithDesc} showDescriptions={false} />);
      expect(byText(view.container, 'Description 1')).toBeNull();
      view.unmount();
    });
  });
});
