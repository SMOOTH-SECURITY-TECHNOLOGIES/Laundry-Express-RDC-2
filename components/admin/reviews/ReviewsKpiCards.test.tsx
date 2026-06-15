// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ReviewsKpiCards } from './ReviewsKpiCards';
import { renderComponent, byText } from './test-utils';

describe('ReviewsKpiCards', () => {
  it('renders 8 KPI cards', () => {
    const { container, unmount } = renderComponent(
      <ReviewsKpiCards kpis={{
        avgRating: 4.6, avgRatingChange: 0.3, avgRatingSparkline: [],
        totalReviews: 1284, totalReviewsChange: 18.7, totalReviewsSparkline: [],
        fiveStar: 842, fiveStarChange: 8.2, fiveStarSparkline: [],
        lowStar: 78, lowStarChange: -4.1, lowStarSparkline: [],
        responseRate: 96, responseRateChange: 4.2, responseRateSparkline: [],
        pendingReviews: 35, pendingReviewsChange: 12, pendingReviewsSparkline: [],
        positiveSentiment: 78, positiveSentimentChange: 3.1, positiveSentimentSparkline: [],
        churnRisk: 12, churnRiskChange: 20, churnRiskSparkline: [],
      }} />,
    );
    expect(byText(container, 'Note moyenne')).not.toBeNull();
    expect(byText(container, 'Risque churn')).not.toBeNull();
    unmount();
  });
});
