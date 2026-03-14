import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import type { Order } from '../types';
import { useAppContext } from '../context/AppContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  order: Order | null;
}

const StarRating: React.FC<{ rating: number; onRatingChange: (rating: number) => void }> = ({ rating, onRatingChange }) => {
  const { t } = useAppContext();
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
          aria-label={t('reviewModal.rateOutOf5', { star })}
        >
          <Icon
            name="star"
            className={`w-10 h-10 transition-colors ${
              (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, order }) => {
  const { t } = useAppContext();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Focus sur le textarea avec un léger délai
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t('reviewModal.pleaseSelectRating'));
      return;
    }
    setError('');
    onSubmit(rating, comment);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full relative transform transition-all animate-slide-up">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" 
          aria-label={t('buttons.close', { default: "Fermer" })}
        >
          <Icon name="xmark" className="w-6 h-6" />
        </button>
        
        <form onSubmit={handleSubmit} className="p-8">
          <h2 id="review-modal-title" className="text-2xl font-bold text-center text-brand-dark mb-2">
            {t('reviewModal.leaveReview')}
          </h2>
          
          <p className="text-center text-slate-600 mb-6">
            {t('reviewModal.shareExperience', { name: order.partner?.name })}
          </p>
          
          <div className="mb-6">
            <StarRating rating={rating} onRatingChange={setRating} />
            {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">
              {t('reviewModal.yourComment')}
            </label>
            <textarea
              ref={textareaRef}
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue resize-vertical"
              placeholder={t('reviewModal.commentPlaceholder')}
              onKeyDown={(e) => {
                // Permettre la saisie normale
                e.stopPropagation();
              }}
            />
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 text-lg transition-colors"
            >
              {t('reviewModal.submitReview')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};