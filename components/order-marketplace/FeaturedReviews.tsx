import React from 'react';
import { Icon } from '../Icon';
import { Review } from '../../types';

interface FeaturedReviewsProps {
  reviews: Review[];
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CL';

const reviewAuthor = (review: Review) => {
  const displayName = (review as Review & { userName?: string }).userName;
  if (displayName) return displayName;
  if (review.userId) return `Client ${review.userId.slice(0, 4).toUpperCase()}`;
  return 'Client';
};

export const FeaturedReviews: React.FC<FeaturedReviewsProps> = ({ reviews }) => {
  const featuredReviews = reviews
    .filter((review) => review.rating >= 4 && review.comment)
    .slice(0, 6);

  if (featuredReviews.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="featured-reviews-title">
      <h2 id="featured-reviews-title" className="text-2xl sm:text-3xl font-bold text-center text-content-primary mb-6">
        Ce que disent nos clients
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {featuredReviews.map((review) => (
          <article key={review.id} className="surface-card rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center shrink-0">
                {initials(reviewAuthor(review))}
              </div>
              <div>
                <h3 className="font-bold text-content-primary">{reviewAuthor(review)}</h3>
                <div className="flex items-center gap-0.5 mt-1" aria-label={`${review.rating} etoiles`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Icon key={index} name="star" className={`w-4 h-4 ${index < review.rating ? 'text-yellow-400' : 'text-content-faint'}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-content-muted mt-4 leading-relaxed">{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
