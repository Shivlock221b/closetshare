'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { ClosetHeader } from '@/components/features/closet/ClosetHeader';
import { OutfitGrid } from '@/components/features/closet/OutfitGrid';
import { Button } from '@/components/ui/Button';
import { getClosetBySlug, getOutfitsByCurator } from '@/lib/firestore';
import { Outfit, Closet } from '@/types';
import styles from './page.module.css';

export default function ClosetPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const { user, signIn } = useAuth();

    const [closet, setCloset] = useState<Closet | null>(null);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch closet by slug
                const closetData = await getClosetBySlug(slug);

                if (!closetData) {
                    setError('Closet not found');
                    setLoading(false);
                    return;
                }

                // Check if closet is published (unless it's the owner viewing)
                if (!closetData.isPublished && user?.id !== closetData.curatorId) {
                    setError('This closet is not published yet');
                    setLoading(false);
                    return;
                }

                setCloset(closetData);

                // Fetch outfits for this curator
                const outfitsData = await getOutfitsByCurator(closetData.curatorId);
                // Only show active outfits
                const activeOutfits = outfitsData.filter(o => o.status === 'active');
                setOutfits(activeOutfits);
            } catch (err) {
                console.error('[ClosetPage] Error fetching data:', err);
                setError('Failed to load closet');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, user?.id]);

    const handleBecomeCurator = async () => {
        if (!user) {
            try {
                await signIn();
                router.push('/dashboard/curator');
            } catch (error) {
                console.error('Error signing in:', error);
            }
        } else {
            router.push('/dashboard/curator');
        }
    };

    if (loading) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <p>Loading closet...</p>
                </div>
            </main>
        );
    }

    if (error || !closet) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div className={styles.errorState}>
                        <h1>{error || 'Closet not found'}</h1>
                        <p>The closet you're looking for doesn't exist or isn't available.</p>
                        <Button onClick={() => router.push('/')}>Go Home</Button>
                    </div>
                </div>
            </main>
        );
    }

    const isOwner = user?.id === closet.curatorId;

    return (
        <main>
            <Header />

            {/* Become Curator Banner - Show only if not the owner */}
            {!isOwner && (
                <div className={styles.becomeCuratorBanner}>
                    <div className={styles.bannerContent}>
                        <span>Want to share your closet and earn?</span>
                        <Button onClick={handleBecomeCurator} variant="primary" size="small">
                            Become a Curator
                        </Button>
                    </div>
                </div>
            )}

            <ClosetHeader
                curatorName={closet.displayName}
                avatarUrl={closet.avatarUrl}
                stats={{
                    outfits: closet.stats.outfitsCount,
                    rentals: closet.stats.rentalsCount,
                    rating: closet.stats.rating,
                }}
                socialLinks={closet.socialLinks}
            />

            {outfits.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No outfits available yet.</p>
                    {isOwner && (
                        <Button onClick={() => router.push('/dashboard/curator/closet/add')}>
                            Add Your First Outfit
                        </Button>
                    )}
                </div>
            ) : (
                <OutfitGrid outfits={outfits} />
            )}
        </main>
    );
}
