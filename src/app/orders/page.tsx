'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getRentalsByUser, getOutfitById } from '@/lib/firestore';
import { Rental, Outfit } from '@/types';
import styles from './page.module.css';

const STATUS_LABELS: Record<Rental['status'], string> = {
    requested: 'Requested',
    paid: 'Payment Confirmed',
    accepted: 'Accepted',
    rejected: 'Rejected',
    shipped: 'Shipped',
    delivered: 'Delivered',
    in_use: 'In Use',
    return_shipped: 'Return Shipped',
    return_delivered: 'Return Received',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Issue Reported',
};

const STATUS_COLORS: Record<Rental['status'], string> = {
    requested: '#f59e0b',
    paid: '#3b82f6',
    accepted: '#10b981',
    rejected: '#ef4444',
    shipped: '#8b5cf6',
    delivered: '#06b6d4',
    in_use: '#22c55e',
    return_shipped: '#6366f1',
    return_delivered: '#a855f7',
    completed: '#16a34a',
    cancelled: '#6b7280',
    disputed: '#dc2626',
};

export default function OrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [outfits, setOutfits] = useState<Record<string, Outfit | null>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const rentalData = await getRentalsByUser(user.id);
                // Sort by createdAt descending (newest first)
                rentalData.sort((a, b) => b.createdAt - a.createdAt);
                setRentals(rentalData);

                // Fetch outfit details for each rental
                const outfitPromises = rentalData.map(async (rental) => {
                    const outfit = await getOutfitById(rental.outfitId);
                    return { outfitId: rental.outfitId, outfit };
                });

                const outfitResults = await Promise.all(outfitPromises);
                const outfitMap: Record<string, Outfit | null> = {};
                outfitResults.forEach(({ outfitId, outfit }) => {
                    outfitMap[outfitId] = outfit;
                });
                setOutfits(outfitMap);
            } catch (error) {
                console.error('[Orders] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (authLoading || loading) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <p>Loading orders...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div className={styles.emptyState}>
                        <h1>Sign in to View Orders</h1>
                        <p>Please sign in to see your rental orders.</p>
                        <Button onClick={() => router.push('/')}>Go Home</Button>
                    </div>
                </div>
            </main>
        );
    }

    if (rentals.length === 0) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div className={styles.emptyState}>
                        <h1>No Orders Yet</h1>
                        <p>You haven't rented any outfits yet. Start browsing!</p>
                        <Button onClick={() => router.push('/')}>Browse Closets</Button>
                    </div>
                </div>
            </main>
        );
    }

    // Separate active and past orders
    const activeStatuses = ['requested', 'paid', 'accepted', 'shipped', 'delivered', 'in_use', 'return_shipped', 'return_delivered'];
    const activeOrders = rentals.filter(r => activeStatuses.includes(r.status));
    const pastOrders = rentals.filter(r => !activeStatuses.includes(r.status));

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <h1 className={styles.title}>My Orders</h1>

                {activeOrders.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Active Orders</h2>
                        <div className={styles.orderList}>
                            {activeOrders.map(rental => {
                                const outfit = outfits[rental.outfitId];
                                return (
                                    <Link
                                        key={rental.id}
                                        href={`/order-status/${rental.id}`}
                                        className={styles.orderCard}
                                    >
                                        <div className={styles.orderImage}>
                                            {outfit?.images[0] ? (
                                                <img src={outfit.images[0]} alt={outfit.title} />
                                            ) : (
                                                <div className={styles.imagePlaceholder}>👗</div>
                                            )}
                                        </div>
                                        <div className={styles.orderDetails}>
                                            <h3 className={styles.orderTitle}>
                                                {outfit?.title || 'Outfit'}
                                            </h3>
                                            <p className={styles.orderDates}>
                                                {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                            </p>
                                            <p className={styles.orderAmount}>
                                                ₹{rental.pricing.total}
                                            </p>
                                        </div>
                                        <div className={styles.orderStatus}>
                                            <span
                                                className={styles.statusBadge}
                                                style={{ backgroundColor: STATUS_COLORS[rental.status] }}
                                            >
                                                {STATUS_LABELS[rental.status]}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {pastOrders.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Past Orders</h2>
                        <div className={styles.orderList}>
                            {pastOrders.map(rental => {
                                const outfit = outfits[rental.outfitId];
                                return (
                                    <Link
                                        key={rental.id}
                                        href={`/order-status/${rental.id}`}
                                        className={styles.orderCard}
                                    >
                                        <div className={styles.orderImage}>
                                            {outfit?.images[0] ? (
                                                <img src={outfit.images[0]} alt={outfit.title} />
                                            ) : (
                                                <div className={styles.imagePlaceholder}>👗</div>
                                            )}
                                        </div>
                                        <div className={styles.orderDetails}>
                                            <h3 className={styles.orderTitle}>
                                                {outfit?.title || 'Outfit'}
                                            </h3>
                                            <p className={styles.orderDates}>
                                                {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                            </p>
                                            <p className={styles.orderAmount}>
                                                ₹{rental.pricing.total}
                                            </p>
                                        </div>
                                        <div className={styles.orderStatus}>
                                            <span
                                                className={styles.statusBadge}
                                                style={{ backgroundColor: STATUS_COLORS[rental.status] }}
                                            >
                                                {STATUS_LABELS[rental.status]}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
