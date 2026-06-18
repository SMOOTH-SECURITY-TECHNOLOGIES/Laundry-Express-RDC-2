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

describe('DeliveryTimeline', () => {
  it('renders all steps', () => {
    const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
    expect(byText(view.container, 'Créée')).not.toBeNull();
    expect(byText(view.container, 'Assignée')).not.toBeNull();
    expect(byText(view.container, 'Ramassage')).not.toBeNull();
    expect(byText(view.container, 'Livrée')).not.toBeNull();
    view.unmount();
  });

  it('renders timestamps', () => {
    const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
    expect(byText(view.container, '10:00')).not.toBeNull();
    expect(byText(view.container, '10:05')).not.toBeNull();
    view.unmount();
  });

  it('renders compact mode with progress bar', () => {
    const view = renderComponent(<DeliveryTimeline steps={mockSteps} compact />);
    const progressBar = view.container.querySelector('.bg-brand-blue.rounded-full');
    expect(progressBar).not.toBeNull();
    const pctText = view.container.querySelector('.text-brand-blue');
    expect(pctText).not.toBeNull();
    view.unmount();
  });

  it('shows current step badge', () => {
    const view = renderComponent(<DeliveryTimeline steps={mockSteps} />);
    expect(byText(view.container, 'En cours')).not.toBeNull();
    view.unmount();
  });

  it('renders with descriptions when showDescriptions=true', () => {
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
