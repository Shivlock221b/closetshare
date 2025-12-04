import React from 'react';
import styles from './OutfitGrid.module.css';
import { OutfitCard } from './OutfitCard';
import { Outfit } from '@/types';

interface OutfitGridProps {
    outfits: Outfit[];
}

export const OutfitGrid: React.FC<OutfitGridProps> = ({ outfits }) => {
    return (
        <div className={styles.grid}>
            {outfits.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
        </div>
    );
};
