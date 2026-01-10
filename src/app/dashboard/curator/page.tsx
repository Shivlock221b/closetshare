'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { PublishClosetModal } from '@/components/features/curator/PublishClosetModal';
import { getClosetByCurator, getClosetByCuratorIdOrLinkedUser, getOutfitsByCurator, getRentalsByCurator } from '@/lib/firestore';
import { Closet } from '@/types';
import styles from './page.module.css';
import Link from 'next/link';

export default function CuratorDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [closet, setCloset] = useState<Closet | null>(null);
    const [stats, setStats] = useState({ outfits: 0, rentals: 0, earnings: 0 });
    const [loading, setLoading] = useState(true);
    const [showPublishModal, setShowPublishModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Use enhanced lookup that also checks for linked closets (admin-created)
                const closetData = await getClosetByCuratorIdOrLinkedUser(user.id);
                setCloset(closetData);

                // If this is a linked closet, we need to use the closet's curatorId for outfits/rentals
                const curatorIdForData = closetData?.curatorId || user.id;

                const outfits = await getOutfitsByCurator(curatorIdForData);
                const rentals = await getRentalsByCurator(curatorIdForData);

                const completedRentals = rentals.filter(r => r.status === 'completed');
                const totalEarnings = completedRentals.reduce((sum, r) => sum + r.curatorEarnings, 0);

                setStats({
                    outfits: outfits.length,
                    rentals: rentals.length,
                    earnings: totalEarnings,
                });
            } catch (error) {
                console.error('[Dashboard] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading]);

    const handlePublishSuccess = (slug: string) => {
        setShowPublishModal(false);
        // Refresh closet data
        if (user) {
            getClosetByCuratorIdOrLinkedUser(user.id).then(setCloset);
        }
    };

    const handleCopyLink = () => {
        if (closet?.slug) {
            const link = `${window.location.origin}/c/${closet.slug}`;
            navigator.clipboard.writeText(link);
            alert('Closet link copied to clipboard!');
        }
    };

    if (authLoading || loading) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <p>Loading...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        router.push('/');
        return null;
    }

    const isPublished = closet?.isPublished || false;
    const canPublish = stats.outfits > 0;

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1>Curator Dashboard</h1>
                        <p className={styles.subtitle}>Welcome back, {user.displayName}!</p>
                    </div>
                    <div className={styles.statusBadge}>
                        {isPublished ? (
                            <span className={styles.published}>✓ Published</span>
                        ) : (
                            <span className={styles.draft}>Draft</span>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.outfits}</div>
                        <div className={styles.statLabel}>Outfits</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.rentals}</div>
                        <div className={styles.statLabel}>Total Rentals</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>₹{stats.earnings}</div>
                        <div className={styles.statLabel}>Total Earnings</div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    {isPublished ? (
                        <Button onClick={handleCopyLink} variant="primary">
                            📋 Copy Closet Link
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setShowPublishModal(true)}
                            variant="primary"
                            disabled={!canPublish}
                        >
                            🚀 Publish Closet
                        </Button>
                    )}
                    {!canPublish && !isPublished && (
                        <p className={styles.hint}>Add at least 1 outfit to publish your closet</p>
                    )}
                </div>

                {/* Navigation Cards */}
                <div className={styles.navCards}>
                    <Link href="/dashboard/curator/closet" className={styles.navCard}>
                        <div className={styles.navIcon}>👗</div>
                        <h3>My Closet</h3>
                        <p>Manage your outfits</p>
                        <div className={styles.navCount}>{stats.outfits} outfits</div>
                    </Link>

                    <Link href="/dashboard/curator/requests" className={styles.navCard}>
                        <div className={styles.navIcon}>📬</div>
                        <h3>Rental Requests</h3>
                        <p>View and manage requests</p>
                        <div className={styles.navCount}>{stats.rentals} requests</div>
                    </Link>

                    <Link href="/dashboard/curator/in-progress" className={styles.navCard}>
                        <div className={styles.navIcon}>🚚</div>
                        <h3>In Progress</h3>
                        <p>Track active rentals</p>
                    </Link>
                </div>

                {/* Publish Modal */}
                {showPublishModal && (
                    <PublishClosetModal
                        onClose={() => setShowPublishModal(false)}
                        onSuccess={handlePublishSuccess}
                        currentCloset={closet}
                    />
                )}
            </div>
        </main>
    );
}
