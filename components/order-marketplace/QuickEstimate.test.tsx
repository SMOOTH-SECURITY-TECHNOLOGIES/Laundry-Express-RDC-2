// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QuickEstimate } from './QuickEstimate';
import { buttonByText, renderComponent } from './test-utils';

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

describe('QuickEstimate', () => {
  it('renders the calculated total and quantity controls', async () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onContinue = vi.fn();

    const view = renderComponent(
      <QuickEstimate
        items={[
          { id: 'costume', name: 'Costume', price: 7, quantity: 1 },
          { id: 'chemise', name: 'Chemise', price: 2, quantity: 2 },
        ]}
        total={11}
        formatPrice={formatPrice}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onContinue={onContinue}
      />
    );

    expect(view.container.querySelector('[data-testid="estimate-total"]')?.textContent).toContain('$11.00');
    view.click(view.container.querySelector('[aria-label="Augmenter Costume"]')!);
    view.click(view.container.querySelector('[aria-label="Diminuer Chemise"]')!);
    view.click(buttonByText(view.container, /continuer la commande/i)!);

    expect(onIncrement).toHaveBeenCalledWith('costume');
    expect(onDecrement).toHaveBeenCalledWith('chemise');
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('disables continue when the estimate is empty', () => {
    const view = renderComponent(
      <QuickEstimate
        items={[{ id: 'robe', name: 'Robe', price: 4, quantity: 0 }]}
        total={0}
        formatPrice={formatPrice}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    expect((buttonByText(view.container, /continuer la commande/i) as HTMLButtonElement).disabled).toBe(true);
  });
});
