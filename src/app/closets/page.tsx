'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getAllClosets, getOutfitsByCurator } from '@/lib/firestore';
import { Closet } from '@/types';
import { Instagram, Star, ShoppingBag } from 'lucide-react';
import styles from './page.module.css';

interface ClosetWithCount extends Closet {
    liveOutfitCount?: number;
}

export default function ClosetsPage() {
    const [closets, setClosets] = useState<ClosetWithCount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClosets = async () => {
            try {
                const data = await getAllClosets();
                // Filter to only show approved closets (or all if no status field yet)
                const approvedClosets = data.filter(c => !c.status || c.status === 'approved');

                // Fetch actual outfit counts for each closet
                const closetsWithCounts = await Promise.all(
                    approvedClosets.map(async (closet) => {
                        const outfits = await getOutfitsByCurator(closet.curatorId);
                        return {
                            ...closet,
                            liveOutfitCount: outfits.length,
                        };
                    })
                );

                setClosets(closetsWithCounts);
            } catch (error) {
                console.error('Error fetching closets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClosets();
    }, []);

    if (loading) {
        return (
            <main>
                <Header />
                <div className={styles.loadingContainer}>
                    <LoadingSpinner size="lg" text="Finding closets..." />
                </div>
            </main>
        );
    }

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Browse Closets</h1>
                    <p className={styles.subtitle}>
                        Discover amazing wardrobes from curators near you
                    </p>
                </div>

                {closets.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No closets available yet. Be the first to create one!</p>
                        <Link href="/dashboard/curator" className={styles.ctaButton}>
                            Become a Curator
                        </Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {closets.map((closet) => (
                            <Link
                                key={closet.id}
                                href={`/c/${closet.slug}`}
                                className={styles.closetCard}
                            >
                                <div className={styles.cardHeader}>
                                    <Avatar
                                        src={closet.avatarUrl}
                                        name={closet.displayName}
                                        size="xl"
                                    />
                                </div>

                                <div className={styles.cardBody}>
                                    <h2 className={styles.closetName}>{closet.displayName}</h2>

                                    {closet.bio && (
                                        <p className={styles.bio}>{closet.bio}</p>
                                    )}

                                    {closet.socialLinks?.instagram && (
                                        <a
                                            href={`https://instagram.com/${closet.socialLinks.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.social}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Instagram size={14} />
                                            @{closet.socialLinks.instagram}
                                        </a>
                                    )}

                                    <div className={styles.stats}>
                                        <div className={styles.stat}>
                                            <span className={styles.statValue}>
                                                {closet.liveOutfitCount ?? closet.stats?.outfitsCount ?? 0}
                                            </span>
                                            <span className={styles.statLabel}>Outfits</span>
                                        </div>
                                        <div className={styles.stat}>
                                            <span className={styles.statValue}>
                                                <ShoppingBag size={14} />
                                                {closet.stats?.rentalsCount || 0}
                                            </span>
                                            <span className={styles.statLabel}>Rentals</span>
                                        </div>
                                        {(closet.stats?.rating ?? 0) > 0 && (
                                            <div className={styles.stat}>
                                                <span className={styles.statValue}>
                                                    <Star size={14} fill="currentColor" />
                                                    {closet.stats?.rating?.toFixed(1)}
                                                </span>
                                                <span className={styles.statLabel}>Rating</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
