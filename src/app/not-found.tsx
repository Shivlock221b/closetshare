'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import styles from './error.module.css';

export default function NotFound() {
    const router = useRouter();

    return (
        <main className={styles.container}>
            <Header />
            <div className={styles.errorContent}>
                <div className={styles.iconWrapper}>
                    <AlertCircle size={64} className={styles.icon} />
                </div>
                <h1 className={styles.title}>Page Not Found</h1>
                <p className={styles.message}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className={styles.actions}>
                    <Button onClick={() => router.back()} variant="secondary">
                        Go Back
                    </Button>
                    <Button onClick={() => router.push('/')}>
                        Go to Home
                    </Button>
                </div>
            </div>
        </main>
    );
}
