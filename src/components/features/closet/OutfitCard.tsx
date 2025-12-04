import React from 'react';
import Link from 'next/link';
import styles from './OutfitCard.module.css';
import { Outfit } from '@/types';

interface OutfitCardProps {
    outfit: Outfit;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({ outfit }) => {
    return (
        <Link href={`/outfit/${outfit.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={outfit.images[0]} alt={outfit.title} className={styles.image} />
            </div>
        </Link>
    );
};
