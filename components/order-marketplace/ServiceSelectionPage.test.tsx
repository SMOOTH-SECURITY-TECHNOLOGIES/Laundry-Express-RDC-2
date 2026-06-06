// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ServiceSelectionPage } from './ServiceSelectionPage';
import { Partner, PartnerType, Service, ServiceType } from '../../types';
import { buttonByText, byText, renderComponent } from './test-utils';

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const services: Service[] = [
  {
    id: 'lessive',
    type: ServiceType.BLANCHISSERIE,
    title: 'Lessive',
    description: 'Lavage, sechage et pliage',
    iconName: 'wash',
    imageUrl: '',
    priceModel: 'per_kg',
    price: 1.5,
  },
];

const partners: Partner[] = [
  {
    id: 'p1',
    name: 'Prestige Pressing',
    slug: 'prestige-pressing',
    type: PartnerType.PRESSING,
    rating: 4.8,
    reviewCount: 124,
    imageUrls: [],
    address: 'Gombe, Kinshasa',
    coordinates: { lat: -4.3, lng: 15.3 },
    enabledFeatures: {
      promotions: true,
      financials: true,
      analytics: true,
      customDomain: false,
      customSubdomain: false,
      teamManagement: true,
      apiAccess: false,
      advancedAutomation: false,
      aiReviewAssistant: true,
    },
    currency: 'USD',
  },
];

describe('ServiceSelectionPage', () => {
  it('renders the marketplace sections and triggers service navigation', async () => {
    const onSelectService = vi.fn();

    const view = renderComponent(
      <ServiceSelectionPage
        services={services}
        partners={partners}
        reviews={[{ id: 'r1', orderId: 'o1', userId: 'u1', partnerId: 'p1', userName: 'Marie K.', rating: 5, comment: 'Service exceptionnel.', createdAt: new Date().toISOString() } as any]}
        estimateItems={[{ id: 'costume', name: 'Costume', price: 7, quantity: 1 }]}
        estimateTotal={7}
        formatPrice={formatPrice}
        onSelectService={onSelectService}
        onIncrementEstimate={vi.fn()}
        onDecrementEstimate={vi.fn()}
        onContinueEstimate={vi.fn()}
      />
    );

    expect(byText(view.container, 'De quel service avez-vous')).not.toBeNull();
    expect(byText(view.container, 'Pourquoi nous choisir ?')).not.toBeNull();
    expect(byText(view.container, 'Prestige Pressing')).not.toBeNull();

    view.click(buttonByText(view.container, /choisir ce service/i)!);
    expect(onSelectService).toHaveBeenCalledWith('lessive');
  });
});
