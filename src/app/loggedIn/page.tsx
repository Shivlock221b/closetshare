'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function LoggedInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Get the redirect URL from query params
                const redirectTo = searchParams.get('redirect') || '/';
                router.push(redirectTo);
            } else {
                // If not authenticated, redirect to home
                router.push('/');
            }
        }
    }, [user, loading, searchParams, router]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--color-background)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Redirecting...</h2>
                <p>Please wait while we redirect you.</p>
            </div>
        </div>
    );
}

export default function LoggedInPage() {
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--color-background)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Loading...</h2>
                </div>
            </div>
        }>
            <LoggedInContent />
        </Suspense>
    );
}
