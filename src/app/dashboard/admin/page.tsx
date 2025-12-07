'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Package, Users, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import {
    getAllRentals,
    getAllOutfits,
    getAllClosets,
    updateRentalStatus,
    getRatingsForUser
} from '@/lib/firestore';
import { Rental, Outfit, Closet } from '@/types';
import styles from './page.module.css';

type Tab = 'overview' | 'outfits' | 'curators' | 'rentals' | 'issues';

const STATUS_COLORS: Record<string, string> = {
    requested: '#f59e0b',
    paid: '#3b82f6',
    accepted: '#10b981',
    shipped: '#8b5cf6',
    delivered: '#06b6d4',
    in_use: '#22c55e',
    return_shipped: '#6366f1',
    return_delivered: '#a855f7',
    completed: '#16a34a',
    rejected: '#ef4444',
    cancelled: '#6b7280',
    disputed: '#dc2626',
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [closets, setClosets] = useState<Closet[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [userRatings, setUserRatings] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rentalsData, outfitsData, closetsData] = await Promise.all([
                    getAllRentals(),
                    getAllOutfits(),
                    getAllClosets(),
                ]);
                // Sort rentals by createdAt descending
                rentalsData.sort((a, b) => b.createdAt - a.createdAt);
                setRentals(rentalsData);
                setOutfits(outfitsData);
                setClosets(closetsData);
            } catch (error) {
                console.error('[Admin] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch user ratings for all curators
    useEffect(() => {
        const fetchUserRatings = async () => {
            if (closets.length === 0) return;

            const ratingsMap = new Map<string, number>();
            for (const closet of closets) {
                try {
                    const ratings = await getRatingsForUser(closet.curatorId);
                    if (ratings.length > 0) {
                        const avg = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
                        ratingsMap.set(closet.curatorId, Number(avg.toFixed(1)));
                    }
                } catch (error) {
                    console.error(`[Admin] Error fetching ratings for ${closet.curatorId}:`, error);
                }
            }
            setUserRatings(ratingsMap);
        };

        fetchUserRatings();
    }, [closets]);

    const getUserRating = (curatorId: string): string => {
        const rating = userRatings.get(curatorId);
        return rating ? `⭐ ${rating}` : 'N/A';
    };

    const handleStatusUpdate = async (rentalId: string, newStatus: Rental['status']) => {
        setUpdatingId(rentalId);
        try {
            await updateRentalStatus(rentalId, newStatus, `Status updated to ${newStatus} by admin`);
            // Refresh rentals
            const updatedRentals = await getAllRentals();
            updatedRentals.sort((a, b) => b.createdAt - a.createdAt);
            setRentals(updatedRentals);
        } catch (error) {
            console.error('[Admin] Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getOutfitTitle = (outfitId: string) => {
        const outfit = outfits.find(o => o.id === outfitId);
        return outfit?.title || 'Unknown Outfit';
    };

    const getCuratorName = (curatorId: string) => {
        const closet = closets.find(c => c.curatorId === curatorId);
        return closet?.displayName || 'Unknown Curator';
    };

    // Calculate stats
    const totalRevenue = rentals
        .filter(r => ['paid', 'accepted', 'shipped', 'delivered', 'in_use', 'return_shipped', 'return_delivered', 'completed'].includes(r.status))
        .reduce((sum, r) => sum + r.pricing.platformFee, 0);

    const activeRentals = rentals.filter(r =>
        ['paid', 'accepted', 'shipped', 'delivered', 'in_use', 'return_shipped', 'return_delivered'].includes(r.status)
    ).length;

    const disputedRentals = rentals.filter(r => r.status === 'disputed');
    const qcPending = rentals.filter(r =>
        (r.status === 'delivered' && (!r.deliveryQC || r.deliveryQC.status === 'pending')) ||
        (r.status === 'return_delivered' && (!r.returnQC || r.returnQC.status === 'pending'))
    );

    if (loading) {
        return (
            <main className={styles.container}>
                <Header />
                <div className={styles.content}>
                    <p>Loading dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <Header />

            <div className={styles.content}>
                <h1 className="text-serif" style={{ fontSize: '2rem', marginBottom: '24px' }}>Admin Dashboard</h1>

                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'overview' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={activeTab === 'outfits' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('outfits')}
                    >
                        Outfits ({outfits.length})
                    </button>
                    <button
                        className={activeTab === 'curators' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('curators')}
                    >
                        Curators ({closets.length})
                    </button>
                    <button
                        className={activeTab === 'rentals' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('rentals')}
                    >
                        Rentals ({rentals.length})
                    </button>
                    <button
                        className={activeTab === 'issues' ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab('issues')}
                    >
                        Issues ({disputedRentals.length + qcPending.length})
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className={styles.section}>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <ShoppingBag className={styles.statIcon} />
                                <div className={styles.statValue}>{outfits.length}</div>
                                <div className={styles.statLabel}>Total Outfits</div>
                            </div>
                            <div className={styles.statCard}>
                                <Users className={styles.statIcon} />
                                <div className={styles.statValue}>{closets.length}</div>
                                <div className={styles.statLabel}>Active Curators</div>
                            </div>
                            <div className={styles.statCard}>
                                <Package className={styles.statIcon} />
                                <div className={styles.statValue}>{activeRentals}</div>
                                <div className={styles.statLabel}>Active Rentals</div>
                            </div>
                            <div className={styles.statCard}>
                                <DollarSign className={styles.statIcon} />
                                <div className={styles.statValue}>₹{totalRevenue}</div>
                                <div className={styles.statLabel}>Platform Revenue</div>
                            </div>
                        </div>

                        {(disputedRentals.length > 0 || qcPending.length > 0) && (
                            <div className={styles.alertSection}>
                                <h3><AlertTriangle size={18} /> Needs Attention</h3>
                                {disputedRentals.length > 0 && (
                                    <div className={styles.alertItem}>
                                        <span className={styles.alertBadge}>{disputedRentals.length}</span>
                                        Disputed rentals requiring resolution
                                    </div>
                                )}
                                {qcPending.length > 0 && (
                                    <div className={styles.alertItem}>
                                        <span className={styles.alertBadge}>{qcPending.length}</span>
                                        QC checks pending (may auto-approve soon)
                                    </div>
                                )}
                            </div>
                        )}

                        <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Recent Rentals</h3>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Outfit</div>
                                <div>Renter</div>
                                <div>Status</div>
                                <div>Total</div>
                                <div>Date</div>
                            </div>
                            {rentals.slice(0, 5).map(rental => (
                                <Link
                                    key={rental.id}
                                    href={`/order-status/${rental.id}`}
                                    className={styles.tableRow}
                                >
                                    <div>{getOutfitTitle(rental.outfitId)}</div>
                                    <div>{rental.renterName}</div>
                                    <div>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: STATUS_COLORS[rental.status] }}
                                        >
                                            {rental.status}
                                        </span>
                                    </div>
                                    <div>₹{rental.pricing.total}</div>
                                    <div>{formatDate(rental.createdAt)}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Outfits Tab */}
                {activeTab === 'outfits' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Outfits</h2>
                        </div>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Title</div>
                                <div>Curator</div>
                                <div>Status</div>
                                <div>Price</div>
                                <div>Rentals</div>
                            </div>
                            {outfits.map(outfit => (
                                <Link
                                    key={outfit.id}
                                    href={`/outfit/${outfit.id}`}
                                    className={styles.tableRow}
                                >
                                    <div className={styles.outfitCell}>
                                        <img src={outfit.images[0]} alt={outfit.title} className={styles.thumbImg} />
                                        {outfit.title}
                                    </div>
                                    <div>{getCuratorName(outfit.curatorId)}</div>
                                    <div>
                                        <span className={outfit.status === 'active' ? styles.badgeActive : styles.badgeArchived}>
                                            {outfit.status}
                                        </span>
                                    </div>
                                    <div>₹{outfit.perNightPrice}/night</div>
                                    <div>{outfit.stats.rentalsCount}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Curators Tab */}
                {activeTab === 'curators' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Curators</h2>
                        </div>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Name</div>
                                <div>Slug</div>
                                <div>Outfits</div>
                                <div>Rentals</div>
                                <div>Rating</div>
                                <div>User Rating</div>
                                <div>Earnings</div>
                            </div>
                            {closets.map(closet => (
                                <Link
                                    key={closet.id}
                                    href={`/c/${closet.slug}`}
                                    className={styles.tableRow}
                                >
                                    <div className={styles.outfitCell}>
                                        {closet.avatarUrl && (
                                            <img src={closet.avatarUrl} alt={closet.displayName} className={styles.thumbImg} />
                                        )}
                                        {closet.displayName}
                                    </div>
                                    <div>/{closet.slug}</div>
                                    <div>{closet.stats.outfitsCount}</div>
                                    <div>{closet.stats.rentalsCount}</div>
                                    <div>⭐ {closet.stats.rating > 0 ? closet.stats.rating.toFixed(1) : '5.0'}</div>
                                    <div>{getUserRating(closet.curatorId)}</div>
                                    <div>₹{closet.stats.totalEarnings}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rentals Tab */}
                {activeTab === 'rentals' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>All Rentals</h2>
                        </div>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Outfit</div>
                                <div>Renter</div>
                                <div>Dates</div>
                                <div>Status</div>
                                <div>Total</div>
                                <div>Actions</div>
                            </div>
                            {rentals.map(rental => (
                                <div key={rental.id} className={styles.tableRow}>
                                    <div>{getOutfitTitle(rental.outfitId)}</div>
                                    <div>{rental.renterName}</div>
                                    <div style={{ fontSize: '12px' }}>
                                        {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                    </div>
                                    <div>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: STATUS_COLORS[rental.status] }}
                                        >
                                            {rental.status}
                                        </span>
                                    </div>
                                    <div>₹{rental.pricing.total}</div>
                                    <div className={styles.actions}>
                                        <Link href={`/order-status/${rental.id}`}>
                                            <Button size="sm" variant="ghost">View</Button>
                                        </Link>
                                        {rental.status === 'paid' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleStatusUpdate(rental.id, 'accepted');
                                                }}
                                                disabled={updatingId === rental.id}
                                            >
                                                {updatingId === rental.id ? '...' : 'Accept'}
                                            </Button>
                                        )}
                                        {rental.status === 'accepted' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleStatusUpdate(rental.id, 'shipped');
                                                }}
                                                disabled={updatingId === rental.id}
                                            >
                                                {updatingId === rental.id ? '...' : 'Ship'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Issues Tab */}
                {activeTab === 'issues' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Issues & QC Pending</h2>
                        </div>

                        {disputedRentals.length > 0 && (
                            <>
                                <h3 className={styles.issueHeading}>⚠️ Disputed Rentals</h3>
                                <div className={styles.table}>
                                    <div className={styles.tableHeader}>
                                        <div>Outfit</div>
                                        <div>Renter</div>
                                        <div>Issue</div>
                                        <div>Actions</div>
                                    </div>
                                    {disputedRentals.map(rental => (
                                        <div key={rental.id} className={styles.tableRow}>
                                            <div>{getOutfitTitle(rental.outfitId)}</div>
                                            <div>{rental.renterName}</div>
                                            <div style={{ fontSize: '13px' }}>
                                                {rental.deliveryQC?.issueDescription || rental.returnQC?.issueDescription || 'Issue reported'}
                                            </div>
                                            <div className={styles.actions}>
                                                <Link href={`/order-status/${rental.id}`}>
                                                    <Button size="sm">Review</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {qcPending.length > 0 && (
                            <>
                                <h3 className={styles.issueHeading}>⏰ QC Pending</h3>
                                <div className={styles.table}>
                                    <div className={styles.tableHeader}>
                                        <div>Outfit</div>
                                        <div>Renter</div>
                                        <div>Type</div>
                                        <div>Deadline</div>
                                    </div>
                                    {qcPending.map(rental => (
                                        <Link
                                            key={rental.id}
                                            href={`/order-status/${rental.id}`}
                                            className={styles.tableRow}
                                        >
                                            <div>{getOutfitTitle(rental.outfitId)}</div>
                                            <div>{rental.renterName}</div>
                                            <div>
                                                {rental.status === 'delivered' ? 'Delivery QC' : 'Return QC'}
                                            </div>
                                            <div>
                                                <Clock size={14} style={{ marginRight: '4px' }} />
                                                {rental.deliveryQC?.deadline
                                                    ? formatDate(rental.deliveryQC.deadline)
                                                    : rental.returnQC?.deadline
                                                        ? formatDate(rental.returnQC.deadline)
                                                        : 'N/A'
                                                }
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}

                        {disputedRentals.length === 0 && qcPending.length === 0 && (
                            <div className={styles.emptyState}>
                                <p>✅ No issues! All rentals are running smoothly.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
