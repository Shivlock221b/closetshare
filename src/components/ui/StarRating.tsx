'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

interface StarRatingProps {
    value: number;        // 0-5
    onChange: (value: number) => void;
    readonly?: boolean;   // For display-only mode
    size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    readonly = false,
    size = 'md',
}) => {
    const [hoverValue, setHoverValue] = useState<number>(0);

    const handleClick = (rating: number) => {
        if (!readonly) {
            onChange(rating);
        }
    };

    const handleMouseEnter = (rating: number) => {
        if (!readonly) {
            setHoverValue(rating);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverValue(0);
        }
    };

    const displayValue = hoverValue || value;

    return (
        <div className={`${styles.container} ${styles[size]}`}>
            {[1, 2, 3, 4, 5].map((rating) => (
                <button
                    key={rating}
                    type="button"
                    className={`${styles.star} ${readonly ? styles.readonly : ''}`}
                    onClick={() => handleClick(rating)}
                    onMouseEnter={() => handleMouseEnter(rating)}
                    onMouseLeave={handleMouseLeave}
                    disabled={readonly}
                    aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
                >
                    <Star
                        className={styles.icon}
                        fill={rating <= displayValue ? 'var(--color-coral)' : 'transparent'}
                        stroke={rating <= displayValue ? 'var(--color-coral)' : 'var(--color-border)'}
                    />
                </button>
            ))}
        </div>
    );
};
