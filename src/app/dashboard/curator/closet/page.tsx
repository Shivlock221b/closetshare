'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminImpersonation } from '@/hooks/useAdminImpersonation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { getOutfitsByCurator, getClosetByCurator } from '@/lib/firestore';
import { Outfit, Closet } from '@/types';
import styles from './page.module.css';

export default function MyClosetPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { effectiveUserId, isImpersonating, impersonatedUserName, exitImpersonation } = useAdminImpersonation();
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [closet, setCloset] = useState<Closet | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!effectiveUserId) return;

            try {
                const [outfitsData, closetData] = await Promise.all([
                    getOutfitsByCurator(effectiveUserId),
                    getClosetByCurator(effectiveUserId)
                ]);
                setOutfits(outfitsData);
                setCloset(closetData);
            } catch (error) {
                console.error('[MyCloset] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchData();
        }
    }, [effectiveUserId, authLoading]);

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
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <p>Please sign in to view your closet</p>
                </div>
            </main>
        );
    }

    const isPublished = closet?.isPublished || false;

    return (
        <main>
            <Header />
            {isImpersonating && (
                <div style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '12px 24px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <span>👁️ Admin View: Viewing as {impersonatedUserName}</span>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={exitImpersonation}
                    >
                        Exit Admin View
                    </Button>
                </div>
            )}
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.titleRow}>
                            <h1>My Closet</h1>
                            {isPublished ? (
                                <span className={styles.publishedBadge}>✓ Published</span>
                            ) : (
                                <span className={styles.draftBadge}>Draft</span>
                            )}
                        </div>
                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{outfits.length}</span>
                                <span className={styles.statLabel}>Outfits</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>
                                    {closet?.stats.rentalsCount || 0}
                                </span>
                                <span className={styles.statLabel}>Total Rentals</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>
                                    ₹{closet?.stats.totalEarnings || 0}
                                </span>
                                <span className={styles.statLabel}>Total Earnings</span>
                            </div>
                        </div>
                    </div>
                    <Link href="/dashboard/curator/closet/add">
                        <Button>+ Add Outfit</Button>
                    </Link>
                </div>

                {outfits.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>👗</div>
                        <h2>Your closet is empty</h2>
                        <p>Start adding outfits to rent them out to your followers</p>
                        <Link href="/dashboard/curator/closet/add">
                            <Button>Add Your First Outfit</Button>
                        </Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {outfits.map(outfit => (
                            <div key={outfit.id} className={styles.card}>
                                <div className={styles.imageContainer}>
                                    <img
                                        src={outfit.images[0]}
                                        alt={outfit.title}
                                        className={styles.image}
                                    />
                                    {outfit.status === 'archived' && (
                                        <div className={styles.archivedBadge}>Archived</div>
                                    )}
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.title}>{outfit.title}</h3>
                                    <div className={styles.details}>
                                        <span className={styles.price}>₹{outfit.perNightPrice}/night</span>
                                        <span className={styles.size}>{outfit.size}</span>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>{outfit.stats.rentalsCount} rentals</span>
                                        {outfit.stats.rating > 0 && (
                                            <span>⭐ {outfit.stats.rating.toFixed(1)}</span>
                                        )}
                                    </div>
                                    <div className={styles.actions}>
                                        <Link href={`/dashboard/curator/closet/edit/${outfit.id}`}>
                                            <Button variant="secondary" size="small">Edit</Button>
                                        </Link>
                                        <Link href={`/outfit/${outfit.id}`}>
                                            <Button variant="secondary" size="small">View</Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
