'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { RentalCard } from '@/components/features/rental/RentalCard';
import { getRentalsByCurator, getOutfitById } from '@/lib/firestore';
import { Rental, Outfit } from '@/types';
import styles from './page.module.css';

interface RentalWithOutfit {
    rental: Rental;
    outfit: Outfit;
}

export default function InProgressPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [rentals, setRentals] = useState<RentalWithOutfit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRentals = async () => {
            if (!user) return;

            try {
                const rentalData = await getRentalsByCurator(user.id);

                // Filter for in-progress rentals
                const inProgressRentals = rentalData.filter(r =>
                    ['accepted', 'shipped', 'delivered', 'in_use', 'return_shipped', 'return_delivered'].includes(r.status)
                );

                // Fetch outfit details for each rental
                const rentalsWithOutfits = await Promise.all(
                    inProgressRentals.map(async (rental) => {
                        const outfit = await getOutfitById(rental.outfitId);
                        return { rental, outfit: outfit! };
                    })
                );

                setRentals(rentalsWithOutfits.filter(r => r.outfit));
            } catch (error) {
                console.error('[InProgress] Error fetching rentals:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchRentals();
        }
    }, [user, authLoading]);

    // Separate rentals by status
    const upcomingRentals = rentals.filter(r => r.rental.status === 'accepted');
    const shippedRentals = rentals.filter(r => r.rental.status === 'shipped' || r.rental.status === 'delivered');
    const activeRentals = rentals.filter(r => r.rental.status === 'in_use');
    const returnRentals = rentals.filter(r => r.rental.status === 'return_shipped' || r.rental.status === 'return_delivered');

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
                    <h1>In Progress Rentals</h1>
                    <p className={styles.subtitle}>
                        Track your active and upcoming rentals
                    </p>
                </div>

                {rentals.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No active rentals at the moment</p>
                    </div>
                ) : (
                    <>
                        {upcomingRentals.length > 0 && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    Upcoming ({upcomingRentals.length})
                                </h2>
                                <div className={styles.rentalsList}>
                                    {upcomingRentals.map(({ rental, outfit }) => (
                                        <RentalCard
                                            key={rental.id}
                                            rental={rental}
                                            outfitTitle={outfit.title}
                                            outfitImage={outfit.images[0]}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {shippedRentals.length > 0 && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    In Transit ({shippedRentals.length})
                                </h2>
                                <div className={styles.rentalsList}>
                                    {shippedRentals.map(({ rental, outfit }) => (
                                        <RentalCard
                                            key={rental.id}
                                            rental={rental}
                                            outfitTitle={outfit.title}
                                            outfitImage={outfit.images[0]}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeRentals.length > 0 && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    Currently Rented ({activeRentals.length})
                                </h2>
                                <div className={styles.rentalsList}>
                                    {activeRentals.map(({ rental, outfit }) => (
                                        <RentalCard
                                            key={rental.id}
                                            rental={rental}
                                            outfitTitle={outfit.title}
                                            outfitImage={outfit.images[0]}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {returnRentals.length > 0 && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    Being Returned ({returnRentals.length})
                                </h2>
                                <div className={styles.rentalsList}>
                                    {returnRentals.map(({ rental, outfit }) => (
                                        <RentalCard
                                            key={rental.id}
                                            rental={rental}
                                            outfitTitle={outfit.title}
                                            outfitImage={outfit.images[0]}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
