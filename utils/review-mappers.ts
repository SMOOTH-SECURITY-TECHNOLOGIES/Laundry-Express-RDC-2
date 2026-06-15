import { Review } from '../types';
import type { PublicReview } from '../services/real-api';

export function mapPublicReviewToFrontend(review: PublicReview): Review & { userName?: string; status?: string } {
  return {
    id: review.id,
    orderId: review.order_id,
    userId: review.user_id,
    partnerId: review.partner_id,
    rating: review.rating,
    comment: review.comment || '',
    createdAt: review.created_at,
    userName: review.customer_first_name || 'Client',
    status: review.status,
  };
}
