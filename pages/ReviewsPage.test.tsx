// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const mockBundle = {
  kpis: {
    avgRating: 4.6, avgRatingChange: 0.3, avgRatingSparkline: [4.3, 4.6],
    totalReviews: 1284, totalReviewsChange: 18.7, totalReviewsSparkline: [1100, 1284],
    fiveStar: 842, fiveStarChange: 8.2, fiveStarSparkline: [800, 842],
    lowStar: 78, lowStarChange: -4.1, lowStarSparkline: [82, 78],
    responseRate: 96, responseRateChange: 4.2, responseRateSparkline: [92, 96],
    pendingReviews: 35, pendingReviewsChange: 12, pendingReviewsSparkline: [30, 35],
    positiveSentiment: 78, positiveSentimentChange: 3.1, positiveSentimentSparkline: [75, 78],
    churnRisk: 12, churnRiskChange: 20, churnRiskSparkline: [10, 12],
  },
  reviews: [{ id: '1', clientName: 'Jean', clientId: 'u1', reviewType: 'order', reviewTypeLabel: 'Commande', rating: 5, comment: 'Excellent', source: 'WhatsApp', date: '2026-06-07', status: 'public', statusLabel: 'Public' }],
  ratingDistribution: [], channels: [], reviewTypes: [], topPartners: [], topDrivers: [],
  negativeQueue: [], sentiment: [], issues: [], agents: [], insights: [], wordCloud: [], trends: [],
  loading: false, error: null, source: 'backend', days: 7,
  refresh: vi.fn(), handleExport: vi.fn(), handleReviewDetail: vi.fn(),
  handleReply: vi.fn(), handleEscalate: vi.fn(), handleReport: vi.fn(),
};

vi.mock('../lib/admin/reviews-api', () => ({ trackReviewEvent: vi.fn(), REVIEWS_WRITE_ENABLED: true }));
vi.mock('../hooks/useReviewsCenter', () => ({ default: () => mockBundle }));

import { ReviewsControlCenter } from './ReviewsControlCenter';

describe('ReviewsPage', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders Customer Feedback Intelligence Center', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<ReviewsControlCenter />); });
    expect(container.textContent).toContain('Customer Feedback Intelligence Center');
    expect(container.textContent).toContain('Note moyenne');
    root.unmount();
    container.remove();
  });
});
