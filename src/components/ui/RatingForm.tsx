'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { StarRating } from './StarRating';
import { Button } from './Button';
import styles from './RatingForm.module.css';

interface RatingFormProps {
    rentalId: string;
    ratingType: 'curator_rating' | 'user_rating';
    ratedUserId: string;
    ratedUserName: string;
    onSubmit: (data: { stars: number; comment: string }) => Promise<void>;
    onSkip: () => void;
}

export const RatingForm: React.FC<RatingFormProps> = ({
    rentalId,
    ratingType,
    ratedUserId,
    ratedUserName,
    onSubmit,
    onSkip,
}) => {
    const [stars, setStars] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (stars === 0) {
            alert('Please select a star rating');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({ stars, comment });
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isForCurator = ratingType === 'curator_rating';
    const title = isForCurator ? 'Rate Your Experience' : 'Rate the Renter';
    const subtitle = isForCurator
        ? `How was your experience with ${ratedUserName}'s closet?`
        : `How was ${ratedUserName} as a renter?`;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Star className={styles.headerIcon} />
                <h3 className={styles.title}>{title}</h3>
            </div>

            <p className={styles.subtitle}>{subtitle}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                    <label className={styles.label}>
                        Your Rating <span className={styles.required}>*</span>
                    </label>
                    <StarRating value={stars} onChange={setStars} size="lg" />
                    {stars > 0 && (
                        <span className={styles.ratingText}>
                            {stars} star{stars > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className={styles.field}>
                    <label htmlFor={`comment-${rentalId}`} className={styles.label}>
                        Additional Comments <span className={styles.optional}>(optional)</span>
                    </label>
                    <textarea
                        id={`comment-${rentalId}`}
                        className={styles.textarea}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        rows={4}
                        maxLength={500}
                    />
                    <span className={styles.charCount}>{comment.length}/500</span>
                </div>

                <div className={styles.actions}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onSkip}
                        disabled={loading}
                    >
                        Skip for Now
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Rating'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
