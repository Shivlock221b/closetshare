'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
    title?: string;
    message?: string;
    showRetry?: boolean;
    showHome?: boolean;
    onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Something Went Wrong',
    message = 'We encountered an unexpected error. Please try again or go back to home.',
    showRetry = true,
    showHome = true,
    onRetry,
}) => {
    const router = useRouter();

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <AlertCircle size={48} className={styles.icon} />
            </div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
                {showRetry && (
                    <Button onClick={handleRetry} variant="secondary">
                        <RefreshCw size={18} />
                        Try Again
                    </Button>
                )}
                {showHome && (
                    <Button onClick={() => router.push('/')}>
                        <Home size={18} />
                        Go Home
                    </Button>
                )}
            </div>
        </div>
    );
};
