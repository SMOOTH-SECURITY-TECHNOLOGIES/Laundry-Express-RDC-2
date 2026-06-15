import { CatalogPartnerService } from '../services/real-api';
import { Service, ServiceType } from '../types';

const serviceVisuals: Record<string, string> = {
  pressing: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=520&q=80',
  blanchisserie: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=520&q=80',
  lavage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=520&q=80',
  cordonnerie: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=520&q=80',
};

const resolveServiceType = (catalog: CatalogPartnerService): ServiceType => {
  const label = `${catalog.service_category_name || ''} ${catalog.service_type_name || ''}`.toLowerCase();
  if (label.includes('cordon')) return ServiceType.CORDONNERIE;
  if (label.includes('lav') || label.includes('blanch') || catalog.pricing_mode === 'kg') {
    return ServiceType.BLANCHISSERIE;
  }
  return ServiceType.PRESSING;
};

const resolveImage = (catalog: CatalogPartnerService): string => {
  const label = `${catalog.service_category_name || ''} ${catalog.service_type_name || ''}`.toLowerCase();
  if (label.includes('cordon')) return serviceVisuals.cordonnerie;
  if (label.includes('lav') || label.includes('blanch') || catalog.pricing_mode === 'kg') {
    return serviceVisuals.blanchisserie;
  }
  return serviceVisuals.pressing;
};

export const mapCatalogPartnerServiceToService = (catalog: CatalogPartnerService): Service => {
  const price = typeof catalog.base_price === 'string'
    ? parseFloat(catalog.base_price)
    : Number(catalog.base_price);
  const isKg = catalog.pricing_mode === 'kg' || catalog.pricing_mode === 'per_kg';
  const type = resolveServiceType(catalog);
  const title = [catalog.service_category_name, catalog.service_type_name].filter(Boolean).join(' · ') || 'Service';

  return {
    id: catalog.id,
    type,
    title,
    description: catalog.service_type_name || catalog.service_category_name || '',
    iconName: type === ServiceType.BLANCHISSERIE ? 'wash' : type === ServiceType.CORDONNERIE ? 'shoppingBag' : 'sparkles',
    imageUrl: resolveImage(catalog),
    priceModel: isKg ? 'per_kg' : 'per_item',
    price: Number.isFinite(price) ? price : 0,
    articleCategories: [],
    turnaroundHours: catalog.estimated_turnaround_hours,
  };
};

export const shopServicePriceLabel = (
  service: Service,
  formatPrice: (price: number) => string,
): string => {
  const suffix = service.priceModel === 'per_kg' ? '/kg' : '/article';
  return `${formatPrice(Number(service.price || 0))}${suffix}`;
};

export const shopLineTotal = (service: Service, quantity: number, weight?: number): number => {
  const price = Number(service.price || 0);
  if (service.priceModel === 'per_kg') return price * (weight || 1);
  return price * quantity;
};

export const shopLinesToServiceItems = (
  lines: { service: Service; quantity: number; weight?: number }[],
) => lines.map((line) => ({
  service: line.service,
  weight: line.service.priceModel === 'per_kg' ? (line.weight || 1) : undefined,
  items: line.service.priceModel === 'per_kg'
    ? undefined
    : [{
      article: {
        id: line.service.id,
        name: line.service.title,
        price: line.service.price || 0,
        description: line.service.description,
      },
      quantity: line.quantity,
    }],
}));
