import { z } from 'zod';

export const addressSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  phone: z.string().min(1, 'Téléphone requis'),
  avenue: z.string().min(1, 'Adresse requise'),
  commune: z.string().min(1, 'Commune requise'),
  city: z.string().min(1, 'Ville requise'),
});

export const pickupSlotSchema = z.object({
  slot: z.string().min(1, 'Choisissez un créneau de ramassage'),
});

export const mobileMoneySchema = z.object({
  operator: z.string().min(1, 'Opérateur requis'),
  phone: z.string()
    .min(1, 'Numéro requis')
    .regex(/^\+?243\d{9}$/, 'Numéro invalide (format RDC : +243 XXX XXX XXX)'),
});

export const cardSchema = z.object({
  number: z.string().min(16, 'Numéro de carte invalide'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format MM/AA'),
  cvv: z.string().min(3, 'CVV invalide'),
});

export type AddressForm = z.infer<typeof addressSchema>;
export type PickupSlotForm = z.infer<typeof pickupSlotSchema>;
export type MobileMoneyForm = z.infer<typeof mobileMoneySchema>;
export type CardForm = z.infer<typeof cardSchema>;

export function validateCheckoutForm(opts: {
  hasAddress: boolean;
  slot: string;
  paymentMethod: string;
  mmPhone?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}): { isValid: boolean; errorMessage: string } {
  if (!opts.hasAddress) {
    return { isValid: false, errorMessage: 'Ajoutez une adresse de ramassage pour continuer.' };
  }
  if (!opts.slot) {
    return { isValid: false, errorMessage: 'Choisissez un créneau de ramassage.' };
  }
  if (opts.paymentMethod === 'mobile_money') {
    if (!opts.mmPhone) {
      return { isValid: false, errorMessage: 'Entrez un numéro de téléphone Mobile Money.' };
    }
    if (!/^\+?243\d{9}$/.test(opts.mmPhone)) {
      return { isValid: false, errorMessage: 'Numéro de téléphone invalide (format RDC : +243 XXX XXX XXX).' };
    }
  }
  if (opts.paymentMethod === 'card') {
    if (!opts.cardNumber || opts.cardNumber.replace(/\s/g, '').length < 16) {
      return { isValid: false, errorMessage: 'Remplissez les informations de votre carte.' };
    }
    if (!opts.cardExpiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(opts.cardExpiry)) {
      return { isValid: false, errorMessage: 'Date d\'expiration invalide.' };
    }
    if (!opts.cardCvv || opts.cardCvv.length < 3) {
      return { isValid: false, errorMessage: 'CVV invalide.' };
    }
  }
  return { isValid: true, errorMessage: '' };
}

export const COMMUNES_RDC = [
  'Gombe', 'Ngaliema', 'Lingwala', 'Barumbu', 'Kinshasa',
  'Limete', 'Kintambo', 'Ngiri-Ngiri', 'Bandalungwa', 'Makala',
  'Kalamu', 'Selembao', 'Lemba', 'Matete', 'Kisenso',
  'Mont-Ngafula', 'Kimbanseke', 'Masina', 'Ndjili', 'Nsele', 'Maluku',
];
