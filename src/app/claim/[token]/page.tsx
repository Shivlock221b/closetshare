'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { getInviteByToken, claimCuratorInvite, getClosetByCurator } from '@/lib/firestore';
import { CuratorInvite, Closet } from '@/types';
import styles from './page.module.css';

interface ClaimPageProps {
    params: Promise<{ token: string }>;
}

export default function ClaimPage({ params }: ClaimPageProps) {
    const router = useRouter();
    const { user, loading: authLoading, signIn } = useAuth();
    const [token, setToken] = useState<string>('');
    const [invite, setInvite] = useState<CuratorInvite | null>(null);
    const [closet, setCloset] = useState<Closet | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Get the token from params
    useEffect(() => {
        const getToken = async () => {
            const resolvedParams = await params;
            setToken(resolvedParams.token);
        };
        getToken();
    }, [params]);

    // Fetch invite data
    useEffect(() => {
        const fetchInvite = async () => {
            if (!token) return;

            setLoading(true);
            try {
                const inviteData = await getInviteByToken(token);

                if (!inviteData) {
                    setError('Invalid or expired invite link');
                    setLoading(false);
                    return;
                }

                if (inviteData.status === 'claimed') {
                    setError('This invite has already been claimed');
                    setLoading(false);
                    return;
                }

                if (inviteData.expiresAt < Date.now()) {
                    setError('This invite link has expired');
                    setLoading(false);
                    return;
                }

                setInvite(inviteData);

                // Fetch the pre-created closet
                const closetData = await getClosetByCurator(inviteData.curatorId);
                setCloset(closetData);
            } catch (err) {
                console.error('Error fetching invite:', err);
                setError('Failed to load invite details');
            } finally {
                setLoading(false);
            }
        };

        fetchInvite();
    }, [token]);

    // Auto-claim if user is already signed in
    useEffect(() => {
        const autoClaim = async () => {
            if (user && invite && !success && !claiming) {
                await handleClaim();
            }
        };

        if (!authLoading) {
            autoClaim();
        }
    }, [user, invite, authLoading]);

    const handleClaim = async () => {
        if (!user || !invite) return;

        setClaiming(true);
        setError(null);

        try {
            const result = await claimCuratorInvite(
                token,
                user.id,
                user.email,
                user.displayName,
                user.avatarUrl
            );

            if (result.success) {
                setSuccess(true);
                // Redirect to curator dashboard after a short delay
                setTimeout(() => {
                    router.push('/dashboard/curator');
                }, 2000);
            } else {
                setError(result.error || 'Failed to claim invite');
            }
        } catch (err) {
            console.error('Error claiming invite:', err);
            setError('An error occurred while claiming your curator account');
        } finally {
            setClaiming(false);
        }
    };

    const handleSignIn = async () => {
        try {
            await signIn();
        } catch (err) {
            console.error('Sign in error:', err);
            setError('Failed to sign in. Please try again.');
        }
    };

    if (loading || authLoading) {
        return (
            <main className={styles.container}>
                <Header />
                <div className={styles.content}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading invite details...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error && !invite) {
        return (
            <main className={styles.container}>
                <Header />
                <div className={styles.content}>
                    <div className={styles.errorState}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h1>Invalid Invite</h1>
                        <p>{error}</p>
                        <Button onClick={() => router.push('/')}>
                            Go to Homepage
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    if (success) {
        return (
            <main className={styles.container}>
                <Header />
                <div className={styles.content}>
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>✓</div>
                        <h1>Welcome, Curator!</h1>
                        <p>Your curator account has been activated successfully.</p>
                        <p className={styles.redirect}>Redirecting to your dashboard...</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <Header />
            <div className={styles.content}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.inviteIcon}>✉️</div>
                        <h1>You&apos;re Invited!</h1>
                        <p>You&apos;ve been invited to become a curator on ClosetShare</p>
                    </div>

                    <div className={styles.inviteDetails}>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Closet Name</span>
                            <span className={styles.detailValue}>{invite?.displayName}</span>
                        </div>
                        {closet?.bio && (
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Bio</span>
                                <span className={styles.detailValue}>{closet.bio}</span>
                            </div>
                        )}
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Status</span>
                            <span className={`${styles.detailValue} ${styles.statusBadge}`}>
                                {closet?.isPublished ? '✓ Published' : 'Draft'}
                            </span>
                        </div>
                        {closet?.stats && (
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Outfits</span>
                                <span className={styles.detailValue}>{closet.stats.outfitsCount} outfits ready</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {!user ? (
                        <div className={styles.signInSection}>
                            <p>Sign in with your Google account to claim this curator account:</p>
                            <Button
                                onClick={handleSignIn}
                                variant="primary"
                                fullWidth
                                disabled={claiming}
                            >
                                <span className={styles.googleIcon}>G</span>
                                Sign in with Google
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.claimSection}>
                            <p>
                                Signed in as <strong>{user.email}</strong>
                            </p>
                            <Button
                                onClick={handleClaim}
                                variant="primary"
                                fullWidth
                                disabled={claiming}
                            >
                                {claiming ? 'Claiming...' : 'Claim My Curator Account'}
                            </Button>
                        </div>
                    )}

                    <div className={styles.footer}>
                        <p>
                            By claiming this account, you agree to our terms of service and
                            will be able to manage this closet, add outfits, and handle rentals.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
