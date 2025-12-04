'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { RentalCard } from '@/components/features/rental/RentalCard';
import { getRentalsByCurator, getOutfitById, updateRentalStatus } from '@/lib/firestore';
import { Rental, Outfit } from '@/types';
import styles from './page.module.css';

interface RentalWithOutfit {
    rental: Rental;
    outfit: Outfit;
}

export default function RentalRequestsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [rentals, setRentals] = useState<RentalWithOutfit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    useEffect(() => {
        const fetchRentals = async () => {
            if (!user) return;

            try {
                const rentalData = await getRentalsByCurator(user.id);

                // Fetch outfit details for each rental
                const rentalsWithOutfits = await Promise.all(
                    rentalData.map(async (rental) => {
                        const outfit = await getOutfitById(rental.outfitId);
                        return { rental, outfit: outfit! };
                    })
                );

                setRentals(rentalsWithOutfits.filter(r => r.outfit));
            } catch (error) {
                console.error('[RentalRequests] Error fetching rentals:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchRentals();
        }
    }, [user, authLoading]);

    const handleAccept = async (rentalId: string) => {
        try {
            await updateRentalStatus(rentalId, 'accepted', 'Accepted by curator');
            // Refresh rentals
            const updatedRentals = rentals.map(r =>
                r.rental.id === rentalId
                    ? { ...r, rental: { ...r.rental, status: 'accepted' as const } }
                    : r
            );
            setRentals(updatedRentals);
            alert('Rental accepted successfully!');
        } catch (error) {
            console.error('[RentalRequests] Error accepting rental:', error);
            alert('Failed to accept rental');
        }
    };

    const handleReject = async (rentalId: string) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await updateRentalStatus(rentalId, 'rejected', `Rejected: ${reason}`);
            // Refresh rentals
            const updatedRentals = rentals.map(r =>
                r.rental.id === rentalId
                    ? { ...r, rental: { ...r.rental, status: 'rejected' as const } }
                    : r
            );
            setRentals(updatedRentals);
            alert('Rental rejected');
        } catch (error) {
            console.error('[RentalRequests] Error rejecting rental:', error);
            alert('Failed to reject rental');
        }
    };

    const filteredRentals = rentals.filter(({ rental }) => {
        if (filter === 'pending') {
            return ['requested', 'paid'].includes(rental.status);
        }
        if (filter === 'completed') {
            return ['completed', 'cancelled', 'rejected'].includes(rental.status);
        }
        return true;
    });

    const totalEarnings = rentals
        .filter(r => r.rental.status === 'completed')
        .reduce((sum, r) => sum + r.rental.curatorEarnings, 0);

    const pendingEarnings = rentals
        .filter(r => ['paid', 'accepted', 'in_transit', 'in_use', 'returned'].includes(r.rental.status))
        .reduce((sum, r) => sum + r.rental.curatorEarnings, 0);

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

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Rental Requests</h1>
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>₹{totalEarnings}</div>
                            <div className={styles.statLabel}>Total Earnings</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>₹{pendingEarnings}</div>
                            <div className={styles.statLabel}>Pending Earnings</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{rentals.length}</div>
                            <div className={styles.statLabel}>Total Rentals</div>
                        </div>
                    </div>
                </div>

                <div className={styles.filters}>
                    <button
                        className={`${styles.filterButton} ${filter === 'all' ? styles.filterActive : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({rentals.length})
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'pending' ? styles.filterActive : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({rentals.filter(r => ['requested', 'paid'].includes(r.rental.status)).length})
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'completed' ? styles.filterActive : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed ({rentals.filter(r => ['completed', 'cancelled', 'rejected'].includes(r.rental.status)).length})
                    </button>
                </div>

                {filteredRentals.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No rental requests found</p>
                    </div>
                ) : (
                    <div className={styles.rentalsList}>
                        {filteredRentals.map(({ rental, outfit }) => (
                            <RentalCard
                                key={rental.id}
                                rental={rental}
                                outfitTitle={outfit.title}
                                outfitImage={outfit.images[0]}
                                showActions={true}
                                onAccept={handleAccept}
                                onReject={handleReject}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
