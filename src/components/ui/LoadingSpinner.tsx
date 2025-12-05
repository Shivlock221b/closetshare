import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

/**
 * Loading spinner with animated dress/hourglass shape
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
}) => {
    return (
        <div className={styles.container}>
            <div className={`${styles.spinner} ${styles[size]}`}>
                <div className={styles.dress}>
                    <div className={styles.top}></div>
                    <div className={styles.middle}></div>
                    <div className={styles.bottom}></div>
                </div>
            </div>
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};
