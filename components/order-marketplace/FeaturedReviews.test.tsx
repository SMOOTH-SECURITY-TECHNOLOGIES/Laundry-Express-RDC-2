// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { FeaturedReviews } from './FeaturedReviews';
import { byText, renderComponent } from './test-utils';

describe('FeaturedReviews', () => {
  it('renders only featured high-rating reviews', () => {
    const view = renderComponent(
      <FeaturedReviews
        reviews={[
          { id: 'r1', orderId: 'o1', userId: 'u1', partnerId: 'p1', userName: 'Marie K.', rating: 5, comment: 'Service exceptionnel.', createdAt: new Date().toISOString() } as any,
          { id: 'r2', orderId: 'o2', userId: 'u2', partnerId: 'p1', userName: 'Jean P.', rating: 3, comment: 'Correct.', createdAt: new Date().toISOString() } as any,
        ]}
      />
    );

    expect(byText(view.container, 'Marie K.')).not.toBeNull();
    expect(byText(view.container, 'Service exceptionnel.')).not.toBeNull();
    expect(byText(view.container, 'Jean P.')).toBeNull();
  });
});
