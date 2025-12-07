'use client';

import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { StarRating } from './StarRating';
import { Rating } from '@/types';
import styles from './RatingDisplay.module.css';

interface RatingDisplayProps {
    rating: Rating;
    title: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ rating, title }) => {
    const formattedDate = new Date(rating.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <CheckCircle className={styles.headerIcon} />
                <h3 className={styles.title}>{title}</h3>
            </div>

            <div className={styles.content}>
                <div className={styles.ratingRow}>
                    <StarRating value={rating.stars} onChange={() => {}} readonly size="md" />
                    <span className={styles.ratingText}>
                        {rating.stars} star{rating.stars > 1 ? 's' : ''}
                    </span>
                </div>

                {rating.comment && (
                    <div className={styles.comment}>
                        <p>"{rating.comment}"</p>
                    </div>
                )}

                <div className={styles.meta}>
                    <span className={styles.date}>Submitted on {formattedDate}</span>
                </div>
            </div>

            <div className={styles.info}>
                <Info className={styles.infoIcon} />
                <span>Ratings cannot be edited once submitted</span>
            </div>
        </div>
    );
};
