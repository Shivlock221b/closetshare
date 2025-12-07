'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logError } from '@/lib/errorLogger';
import { useAuth } from '@/contexts/AuthContext';
import styles from './error.module.css';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        // Log the error to Firestore for admin review
        logError(error, {
            userId: user?.id,
            userEmail: user?.email,
            severity: 'high',
            category: 'runtime',
            metadata: {
                digest: error.digest,
            },
        });

        // Also log to console
        console.error('[Error Boundary]', error);
    }, [error, user]);

    return (
        <main className={styles.container}>
            <Header />
            <div className={styles.errorContent}>
                <div className={styles.iconWrapper}>
                    <AlertCircle size={64} className={styles.icon} />
                </div>
                <h1 className={styles.title}>Something Went Wrong</h1>
                <p className={styles.message}>
                    We encountered an unexpected error. Please try reloading the page or check back in a few moments.
                </p>
                {error.message && (
                    <div className={styles.errorDetails}>
                        <details className={styles.detailsBlock}>
                            <summary>Error Details</summary>
                            <code>{error.message}</code>
                        </details>
                    </div>
                )}
                <div className={styles.actions}>
                    <Button onClick={() => reset()} variant="secondary">
                        <RefreshCw size={18} />
                        Try Again
                    </Button>
                    <Button onClick={() => router.push('/')}>
                        Go to Home
                    </Button>
                </div>
            </div>
        </main>
    );
}
