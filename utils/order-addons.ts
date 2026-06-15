import { OrderAddOnItem } from '../services/real-api';

export type OrderAddOnUiItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
};

export const DEFAULT_ORDER_ADDONS: OrderAddOnUiItem[] = [
  {
    id: 'chaussures',
    name: 'Nettoyage chaussures',
    description: 'Entretien complet de vos chaussures.',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=180&q=80',
    price: 5,
  },
  {
    id: 'repassage-premium',
    name: 'Repassage premium',
    description: 'Repassage vapeur professionnel.',
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=180&q=80',
    price: 3,
  },
  {
    id: 'desodorisation',
    name: 'Desodorisation textile',
    description: 'Elimine les odeurs et rafraichit.',
    imageUrl: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=180&q=80',
    price: 2,
  },
  {
    id: 'sac-transport',
    name: 'Sac de transport',
    description: 'Sac premium pour votre linge.',
    imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=180&q=80',
    price: 2,
  },
];

export const mapOrderAddOnFromApi = (item: OrderAddOnItem): OrderAddOnUiItem => ({
  id: item.slug,
  name: item.name,
  description: item.description,
  imageUrl: item.image_url,
  price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price),
});

export const slugifyAddOn = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
