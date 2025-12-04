'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoggedInPage() {
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
