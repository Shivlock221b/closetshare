import React from 'react';
import Link from 'next/link';
import styles from './OutfitCard.module.css';
import { Outfit } from '@/types';

interface OutfitCardProps {
    outfit: Outfit;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({ outfit }) => {
    // Fallback to placeholder if no images
    const imageUrl = outfit.images && outfit.images.length > 0
        ? outfit.images[0]
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f5f5f5" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

    return (
        <Link href={`/outfit/${outfit.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={imageUrl} alt={outfit.title} className={styles.image} />
            </div>
        </Link>
    );
};
