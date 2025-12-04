import React from 'react';
import { Instagram } from 'lucide-react';
import styles from './ClosetHeader.module.css';

interface ClosetHeaderProps {
    curatorName: string;
    avatarUrl?: string;
    stats: {
        outfits: number;
        rentals: number;
        rating: number;
    };
    socialLinks?: {
        instagram?: string;
        pinterest?: string;
        website?: string;
    };
}

export const ClosetHeader: React.FC<ClosetHeaderProps> = ({
    curatorName,
    avatarUrl,
    stats,
    socialLinks,
}) => {
    const handleCuratorClick = () => {
        if (socialLinks?.instagram) {
            window.open(socialLinks.instagram, '_blank');
        }
    };

    const hasInstagram = !!socialLinks?.instagram;

    return (
        <div className={styles.container}>
            <div
                className={`${styles.avatarWrapper} ${hasInstagram ? styles.clickable : ''}`}
                onClick={hasInstagram ? handleCuratorClick : undefined}
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt={curatorName} className={styles.avatar} />
                ) : (
                    <div className={styles.avatarPlaceholder}>{curatorName[0]}</div>
                )}
                {hasInstagram && (
                    <div className={styles.instagramBadge}>
                        <Instagram size={14} />
                    </div>
                )}
            </div>

            <h1
                className={`${styles.name} ${hasInstagram ? styles.clickable : ''}`}
                onClick={hasInstagram ? handleCuratorClick : undefined}
            >
                {curatorName}
            </h1>

            <div className={styles.statsRow}>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.outfits}</span>
                    <span className={styles.statLabel}>OUTFITS</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.rentals}</span>
                    <span className={styles.statLabel}>RENTALS</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.rating}</span>
                    <span className={styles.statLabel}>RATING</span>
                </div>
            </div>

            {hasInstagram && (
                <button className={styles.curatorBtn} onClick={handleCuratorClick}>
                    <Instagram size={16} />
                    FOLLOW ON INSTAGRAM
                </button>
            )}
        </div>
    );
};
