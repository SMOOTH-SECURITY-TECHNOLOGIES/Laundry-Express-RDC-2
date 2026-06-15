import { realApi } from './real-api';
import type { MobileMoneyPayment } from '../types';

export type FrontendPaymentMethod = 'cash' | 'mobile_money' | 'card';

export interface ProcessOrderPaymentInput {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: FrontendPaymentMethod;
  mobileMoneyDetails?: MobileMoneyPayment;
}

export interface ProcessOrderPaymentResult {
  intentId: string;
  intentStatus: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  transactionId?: string;
}

function mapPaymentMethod(method: FrontendPaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'cash_on_delivery';
    case 'mobile_money':
      return 'mobile_money';
    case 'card':
      return 'card';
    default:
      return 'cash_on_delivery';
  }
}

function resolvePaymentStatus(intentStatus: string, orderPaymentStatus?: string): ProcessOrderPaymentResult['paymentStatus'] {
  if (orderPaymentStatus === 'paid') return 'paid';
  if (intentStatus === 'succeeded') return 'paid';
  if (intentStatus === 'failed' || intentStatus === 'cancelled') return 'failed';
  return 'pending';
}

export async function processOrderPayment(input: ProcessOrderPaymentInput): Promise<ProcessOrderPaymentResult> {
  const intent = await realApi.createPaymentIntent({
    order_id: input.orderId,
    payment_method: mapPaymentMethod(input.paymentMethod),
    amount_expected: input.amount,
    currency: input.currency || 'USD',
    payment_metadata: input.mobileMoneyDetails
      ? {
          provider: input.mobileMoneyDetails.provider,
          phone: input.mobileMoneyDetails.phoneNumber,
          source: 'checkout',
        }
      : { source: 'checkout' },
  });

  const transaction = await realApi.initiatePayment(intent.id);

  let orderPaymentStatus: string | undefined;
  try {
    const summary = await realApi.getOrderPaymentSummary(input.orderId);
    orderPaymentStatus = summary.payment_status;
  } catch {
    orderPaymentStatus = undefined;
  }

  return {
    intentId: intent.id,
    intentStatus: intent.status,
    paymentStatus: resolvePaymentStatus(intent.status, orderPaymentStatus),
    transactionId: transaction.id,
  };
}
