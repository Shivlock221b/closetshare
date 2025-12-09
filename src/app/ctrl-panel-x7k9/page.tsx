'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    AlertTriangle, Package, Users, ShoppingBag, DollarSign, Clock,
    Edit, Trash2, Eye, Check, X, ChevronDown, Save, Plus
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import {
    getAllRentals,
    getAllOutfits,
    getAllClosets,
    getAllUsers,
    updateRentalStatus,
    deleteRental,
    deleteOutfit,
    deleteCloset,
    updateOutfit,
    updateCloset,
    updateRentalTimeline,
} from '@/lib/firestore';
import { Rental, Outfit, Closet, RentalStatus, User } from '@/types';
import styles from './page.module.css';

type Tab = 'overview' | 'outfits' | 'closets' | 'users' | 'rentals' | 'issues';
type EditMode = { type: 'rental' | 'outfit' | 'closet'; id: string } | null;

const STATUS_OPTIONS: RentalStatus[] = [
    'requested', 'paid', 'accepted', 'shipped', 'delivered', 'in_use',
    'return_shipped', 'return_delivered', 'completed', 'rejected', 'cancelled', 'disputed'
];

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

export default function AdminConsolePage() {
    const router = useRouter();

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [authError, setAuthError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Data state
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [closets, setClosets] = useState<Closet[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Edit state
    const [editMode, setEditMode] = useState<EditMode>(null);
    const [statusNote, setStatusNote] = useState('');
    const [statusLink, setStatusLink] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<RentalStatus | ''>('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Timeline edit state
    const [editingTimeline, setEditingTimeline] = useState<{ rentalId: string; index: number } | null>(null);
    const [timelineNote, setTimelineNote] = useState('');

    // Check session storage for auth
    useEffect(() => {
        const authStatus = sessionStorage.getItem('adminAuth');
        if (authStatus === 'true') {
            setIsAuthenticated(true);
            fetchAllData();
        }
        setCheckingAuth(false);
    }, []);

    const handlePasscodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        try {
            const response = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            });

            if (response.ok) {
                sessionStorage.setItem('adminAuth', 'true');
                setIsAuthenticated(true);
                fetchAllData();
            } else {
                setAuthError('Invalid passcode');
            }
        } catch (error) {
            setAuthError('Authentication failed');
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [rentalsData, outfitsData, closetsData, usersData] = await Promise.all([
                getAllRentals(),
                getAllOutfits(),
                getAllClosets(),
                getAllUsers(),
            ]);
            rentalsData.sort((a, b) => b.createdAt - a.createdAt);
            setRentals(rentalsData);
            setOutfits(outfitsData);
            setClosets(closetsData);
            setUsers(usersData);
        } catch (error) {
            console.error('[Admin] Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (rentalId: string) => {
        if (!selectedStatus) return;

        setUpdatingId(rentalId);
        try {
            await updateRentalStatus(
                rentalId,
                selectedStatus,
                statusNote || `Status changed to ${selectedStatus}`,
                statusLink || undefined
            );
            await fetchAllData();
            setEditMode(null);
            setSelectedStatus('');
            setStatusNote('');
            setStatusLink('');
            alert('Status updated successfully!');
        } catch (error) {
            console.error('[Admin] Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleTimelineNoteUpdate = async (rentalId: string, index: number) => {
        try {
            await updateRentalTimeline(rentalId, index, { note: timelineNote });
            await fetchAllData();
            setEditingTimeline(null);
            setTimelineNote('');
            alert('Timeline updated!');
        } catch (error) {
            console.error('[Admin] Error updating timeline:', error);
            alert('Failed to update timeline');
        }
    };

    const handleDeleteRental = async (rentalId: string) => {
        if (!confirm('Are you sure you want to delete this rental? This cannot be undone.')) return;

        try {
            await deleteRental(rentalId);
            await fetchAllData();
            alert('Rental deleted');
        } catch (error) {
            console.error('[Admin] Error deleting rental:', error);
            alert('Failed to delete rental');
        }
    };

    const handleDeleteOutfit = async (outfitId: string) => {
        if (!confirm('Are you sure you want to delete this outfit? This cannot be undone.')) return;

        try {
            await deleteOutfit(outfitId);
            await fetchAllData();
            alert('Outfit deleted');
        } catch (error) {
            console.error('[Admin] Error deleting outfit:', error);
            alert('Failed to delete outfit');
        }
    };

    const handleDeleteCloset = async (closetId: string) => {
        if (!confirm('Are you sure you want to delete this closet? This cannot be undone.')) return;

        try {
            await deleteCloset(closetId);
            await fetchAllData();
            alert('Closet deleted');
        } catch (error) {
            console.error('[Admin] Error deleting closet:', error);
            alert('Failed to delete closet');
        }
    };

    const formatDate = (timestamp: number | { toDate: () => Date } | Date | undefined) => {
        if (!timestamp) return 'N/A';

        let date: Date;
        if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
            // Firestore Timestamp object
            date = timestamp.toDate();
        } else {
            return 'N/A';
        }

        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

    // Passcode entry screen
    if (checkingAuth) {
        return (
            <main className={styles.container}>
                <div className={styles.authScreen}>
                    <div className={styles.authCard}>
                        <p>Checking authentication...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className={styles.container}>
                <div className={styles.authScreen}>
                    <div className={styles.authCard}>
                        <h1>🔐 Admin Console</h1>
                        <p>Enter passcode to continue</p>
                        <form onSubmit={handlePasscodeSubmit} className={styles.authForm}>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter passcode"
                                className={styles.authInput}
                                autoFocus
                            />
                            {authError && <p className={styles.authError}>{authError}</p>}
                            <Button type="submit">Enter</Button>
                        </form>
                    </div>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className={styles.container}>
                <Header />
                <div className={styles.content}>
                    <p>Loading admin console...</p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <Header />

            <div className={styles.content}>
                <div className={styles.titleRow}>
                    <h1 className="text-serif">Admin Console</h1>
                    <Button variant="secondary" size="sm" onClick={fetchAllData}>
                        Refresh Data
                    </Button>
                </div>

                <div className={styles.tabs}>
                    {(['overview', 'rentals', 'outfits', 'closets', 'users', 'issues'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            className={activeTab === tab ? styles.tabActive : styles.tab}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'users' && ` (${users.length})`}
                            {tab === 'issues' && disputedRentals.length > 0 && (
                                <span className={styles.badge}>{disputedRentals.length}</span>
                            )}
                        </button>
                    ))}
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

                        <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Recent Rentals</h3>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Outfit</div>
                                <div>Renter</div>
                                <div>Status</div>
                                <div>Total</div>
                                <div>Created</div>
                            </div>
                            {rentals.slice(0, 10).map(rental => (
                                <div
                                    key={rental.id}
                                    className={styles.tableRow}
                                    onClick={() => setActiveTab('rentals')}
                                    style={{ cursor: 'pointer' }}
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rentals Tab with Full CRUD */}
                {activeTab === 'rentals' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>All Rentals ({rentals.length})</h2>
                        </div>

                        {rentals.map(rental => (
                            <div key={rental.id} className={styles.rentalCard}>
                                <div className={styles.rentalHeader}>
                                    <div>
                                        <strong>{getOutfitTitle(rental.outfitId)}</strong>
                                        <span className={styles.rentalId}>#{rental.id.slice(-8)}</span>
                                    </div>
                                    <div className={styles.rentalActions}>
                                        <Link href={`/order-status/${rental.id}`} target="_blank">
                                            <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditMode({ type: 'rental', id: rental.id });
                                                setSelectedStatus(rental.status);
                                            }}
                                        >
                                            <Edit size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteRental(rental.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>

                                <div className={styles.rentalDetails}>
                                    <div className={styles.detailItem}>
                                        <span>Renter:</span> {rental.renterName} ({rental.renterEmail})
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span>Period:</span> {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span>Total:</span> ₹{rental.pricing.total}
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span>Status:</span>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: STATUS_COLORS[rental.status], marginLeft: '8px' }}
                                        >
                                            {rental.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Edit Panel */}
                                {editMode?.type === 'rental' && editMode.id === rental.id && (
                                    <div className={styles.editPanel}>
                                        <h4>Update Status</h4>
                                        <div className={styles.editRow}>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value as RentalStatus)}
                                                className={styles.select}
                                            >
                                                {STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Add a note (optional)"
                                                value={statusNote}
                                                onChange={(e) => setStatusNote(e.target.value)}
                                                className={styles.noteInput}
                                            />
                                        </div>
                                        <div className={styles.editRow}>
                                            <input
                                                type="url"
                                                placeholder="Add a link URL (optional, e.g. tracking link)"
                                                value={statusLink}
                                                onChange={(e) => setStatusLink(e.target.value)}
                                                className={styles.noteInput}
                                                style={{ flex: 1 }}
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => handleStatusUpdate(rental.id)}
                                                disabled={updatingId === rental.id}
                                            >
                                                {updatingId === rental.id ? '...' : 'Save'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditMode(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>

                                        {/* Timeline Editor */}
                                        <h4 style={{ marginTop: '16px' }}>Timeline</h4>
                                        <div className={styles.timeline}>
                                            {rental.timeline.map((entry, idx) => (
                                                <div key={idx} className={styles.timelineEntry}>
                                                    <div className={styles.timelineHeader}>
                                                        <span
                                                            className={styles.statusBadge}
                                                            style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                                                        >
                                                            {entry.status}
                                                        </span>
                                                        <span className={styles.timelineTime}>
                                                            {formatDate(entry.timestamp)}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingTimeline({ rentalId: rental.id, index: idx });
                                                                setTimelineNote(entry.note || '');
                                                            }}
                                                        >
                                                            <Edit size={12} />
                                                        </Button>
                                                    </div>

                                                    {editingTimeline?.rentalId === rental.id && editingTimeline.index === idx ? (
                                                        <div className={styles.timelineEdit}>
                                                            <input
                                                                type="text"
                                                                value={timelineNote}
                                                                onChange={(e) => setTimelineNote(e.target.value)}
                                                                placeholder="Edit note..."
                                                                className={styles.noteInput}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleTimelineNoteUpdate(rental.id, idx)}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingTimeline(null)}
                                                            >
                                                                <X size={14} />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        entry.note && <p className={styles.timelineNote}>{entry.note}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Outfits Tab */}
                {activeTab === 'outfits' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>All Outfits ({outfits.length})</h2>
                        </div>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Image</div>
                                <div>Title</div>
                                <div>Curator</div>
                                <div>Price</div>
                                <div>Status</div>
                                <div>Actions</div>
                            </div>
                            {outfits.map(outfit => (
                                <div key={outfit.id} className={styles.tableRow}>
                                    <div>
                                        <img src={outfit.images[0]} alt={outfit.title} className={styles.thumbImg} />
                                    </div>
                                    <div>{outfit.title}</div>
                                    <div>{getCuratorName(outfit.curatorId)}</div>
                                    <div>₹{outfit.perNightPrice}/night</div>
                                    <div>
                                        <span className={outfit.status === 'active' ? styles.badgeActive : styles.badgeArchived}>
                                            {outfit.status}
                                        </span>
                                    </div>
                                    <div className={styles.actions}>
                                        <Link href={`/outfit/${outfit.id}`} target="_blank">
                                            <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteOutfit(outfit.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Closets Tab */}
                {activeTab === 'closets' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>All Closets ({closets.length})</h2>
                        </div>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Avatar</div>
                                <div>Name</div>
                                <div>Slug</div>
                                <div>Outfits</div>
                                <div>Earnings</div>
                                <div>Actions</div>
                            </div>
                            {closets.map(closet => (
                                <div key={closet.id} className={styles.tableRow}>
                                    <div>
                                        {closet.avatarUrl ? (
                                            <img src={closet.avatarUrl} alt={closet.displayName} className={styles.thumbImg} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>👤</div>
                                        )}
                                    </div>
                                    <div>{closet.displayName}</div>
                                    <div>/c/{closet.slug}</div>
                                    <div>{closet.stats.outfitsCount}</div>
                                    <div>₹{closet.stats.totalEarnings}</div>
                                    <div className={styles.actions}>
                                        <Link href={`/c/${closet.slug}`} target="_blank">
                                            <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteCloset(closet.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>All Users ({users.length})</h2>
                        </div>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <div>Avatar</div>
                                <div>Name</div>
                                <div>Email</div>
                                <div>Role</div>
                                <div>Outfits</div>
                                <div>Rentals</div>
                                <div>Actions</div>
                            </div>
                            {users.map(user => (
                                <div key={user.id} className={styles.tableRow}>
                                    <div>
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.displayName} className={styles.thumbImg} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>👤</div>
                                        )}
                                    </div>
                                    <div>{user.displayName}</div>
                                    <div>{user.email}</div>
                                    <div>
                                        <span className={user.role === 'curator' ? styles.badgeActive : styles.badgeArchived}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div>{user.stats?.outfitsCount || 0}</div>
                                    <div>{user.stats?.rentalsCount || 0}</div>
                                    <div className={styles.actions}>
                                        {user.role === 'curator' && (
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => {
                                                    // Store impersonation data in localStorage
                                                    localStorage.setItem('admin_impersonate_user_id', user.id);
                                                    localStorage.setItem('admin_impersonate_user_name', user.displayName);
                                                    // Navigate to curator dashboard
                                                    window.location.href = '/dashboard/curator';
                                                }}
                                            >
                                                Access Dashboard
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
                        <h2>Disputed & Issues</h2>
                        {disputedRentals.length > 0 ? (
                            disputedRentals.map(rental => (
                                <div key={rental.id} className={styles.issueCard}>
                                    <div className={styles.issueHeader}>
                                        <div>
                                            <strong>{getOutfitTitle(rental.outfitId)}</strong>
                                            <span className={styles.issueBadge}>
                                                {rental.issueReport?.category || 'Disputed'}
                                            </span>
                                        </div>
                                        <Link href={`/order-status/${rental.id}`} target="_blank">
                                            <Button size="sm">View Order</Button>
                                        </Link>
                                    </div>

                                    <div className={styles.issueDetails}>
                                        <div className={styles.issueRow}>
                                            <span className={styles.issueLabel}>Renter:</span>
                                            <span>{rental.renterName} ({rental.renterEmail})</span>
                                        </div>

                                        {rental.issueReport ? (
                                            <>
                                                <div className={styles.issueRow}>
                                                    <span className={styles.issueLabel}>Reporter:</span>
                                                    <span>{rental.issueReport.reporterType === 'user' ? 'Renter' : 'Curator'}</span>
                                                </div>
                                                <div className={styles.issueRow}>
                                                    <span className={styles.issueLabel}>Reported:</span>
                                                    <span>{new Date(rental.issueReport.reportedAt).toLocaleString()}</span>
                                                </div>
                                                <div className={styles.issueDescription}>
                                                    <span className={styles.issueLabel}>Description:</span>
                                                    <p>{rental.issueReport.description}</p>
                                                </div>

                                                {rental.issueReport.imageUrls && rental.issueReport.imageUrls.length > 0 && (
                                                    <div className={styles.issueImages}>
                                                        <span className={styles.issueLabel}>Photos ({rental.issueReport.imageUrls.length}):</span>
                                                        <div className={styles.carouselContainer}>
                                                            <ImageCarousel
                                                                images={rental.issueReport.imageUrls}
                                                                alt={`Issue report for ${getOutfitTitle(rental.outfitId)}`}
                                                                enableFullscreen={true}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p>Issue: {rental.deliveryQC?.issueDescription || rental.returnQC?.issueDescription || 'No details available'}</p>
                                        )}
                                    </div>

                                    <div className={styles.issueActions}>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setEditMode({ type: 'rental', id: rental.id });
                                                setSelectedStatus(rental.status);
                                            }}
                                        >
                                            <Edit size={14} /> Resolve Issue
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                ✅ No issues! All orders running smoothly.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
