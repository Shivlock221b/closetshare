import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

/**
 * Avatar component that shows user initials as fallback when no image is provided
 */
export const Avatar: React.FC<AvatarProps> = ({
    src,
    name = '',
    size = 'md',
    className = '',
}) => {
    const getInitials = (name: string): string => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const getColorFromName = (name: string): string => {
        const colors = [
            '#FF7F6A', // coral
            '#6366F1', // indigo
            '#10B981', // emerald
            '#F59E0B', // amber
            '#EC4899', // pink
            '#8B5CF6', // violet
            '#06B6D4', // cyan
            '#84CC16', // lime
        ];

        if (!name) return colors[0];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const hasImage = src && src.length > 0;

    return (
        <div
            className={`${styles.avatar} ${styles[size]} ${className}`}
            style={!hasImage ? { backgroundColor: getColorFromName(name) } : undefined}
        >
            {hasImage ? (
                <img
                    src={src}
                    alt={name || 'Avatar'}
                    className={styles.image}
                />
            ) : (
                <span className={styles.initials}>
                    {getInitials(name)}
                </span>
            )}
        </div>
    );
};
