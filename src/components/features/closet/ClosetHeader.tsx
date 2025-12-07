import React from 'react';
import { Instagram } from 'lucide-react';
import styles from './ClosetHeader.module.css';

interface ClosetHeaderProps {
    curatorName: string;
    avatarUrl?: string;
    bio?: string;
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
    bio,
    stats,
    socialLinks,
}) => {
    const handleCuratorClick = () => {
        if (socialLinks?.instagram) {
            // Construct Instagram URL from username
            const instagramUrl = `https://instagram.com/${socialLinks.instagram}`;
            window.open(instagramUrl, '_blank');
        }
    };

    const hasInstagram = !!socialLinks?.instagram;

    return (
        <div className={styles.container}>
            <div className={styles.avatarWrapper}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={curatorName} className={styles.avatar} />
                ) : (
                    <div className={styles.avatarPlaceholder}>{curatorName[0]}</div>
                )}
            </div>

            <h1 className={styles.name}>
                {curatorName}
            </h1>

            {bio && <p className={styles.bio}>{bio}</p>}

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
                    <span className={styles.statValue}>
                        ⭐ {stats.rating > 0 ? stats.rating.toFixed(1) : '5.0'}
                    </span>
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
