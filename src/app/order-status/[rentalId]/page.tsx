'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Clock, Package } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
    getRentalById,
    getOutfitById,
    updateRentalStatus,
    submitDeliveryQC,
    submitReturnQC
} from '@/lib/firestore';
import { Rental, Outfit } from '@/types';
import styles from './page.module.css';

export default function OrderStatusPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [rental, setRental] = useState<Rental | null>(null);
    const [outfit, setOutfit] = useState<Outfit | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [submittingQC, setSubmittingQC] = useState(false);

    // Delivery QC form state
    const [deliveryQCData, setDeliveryQCData] = useState({
        itemsReceived: true,
        conditionOk: true,
        sizeOk: true,
        issueDescription: '',
        returnRequested: false,
    });

    // Return QC form state (for curator)
    const [returnQCData, setReturnQCData] = useState({
        conditionOk: true,
        damageLevel: 'none' as 'none' | 'minor' | 'major' | 'total',
        issueDescription: '',
    });

    const rentalId = params.rentalId as string;

    const fetchData = async () => {
        try {
            const rentalData = await getRentalById(rentalId);
            if (rentalData) {
                setRental(rentalData);
                try {
                    const outfitData = await getOutfitById(rentalData.outfitId);
                    setOutfit(outfitData);
                } catch (outfitError) {
                    console.warn('[OrderStatus] Could not fetch outfit:', outfitError);
                }
            }
        } catch (error) {
            console.error('[OrderStatus] Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [rentalId]);

    const handleCancelRental = async () => {
        if (!rental) return;

        const confirmed = confirm(
            'Are you sure you want to cancel this rental? This action cannot be undone.'
        );

        if (!confirmed) return;

        setCancelling(true);
        try {
            await updateRentalStatus(rentalId, 'cancelled', 'Cancelled by user');
            await fetchData();
            alert('Rental cancelled successfully');
        } catch (error) {
            console.error('[OrderStatus] Error cancelling rental:', error);
            alert('Failed to cancel rental. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const handleDeliveryQCSubmit = async (allOk: boolean) => {
        setSubmittingQC(true);
        try {
            await submitDeliveryQC(rentalId, {
                itemsReceived: allOk ? true : deliveryQCData.itemsReceived,
                conditionOk: allOk ? true : deliveryQCData.conditionOk,
                sizeOk: allOk ? true : deliveryQCData.sizeOk,
                issueDescription: allOk ? '' : deliveryQCData.issueDescription,
                returnRequested: allOk ? false : deliveryQCData.returnRequested,
            });
            await fetchData();
            alert(allOk ? 'Thank you for confirming!' : 'Issue reported. Our team will contact you shortly.');
        } catch (error) {
            console.error('[OrderStatus] Error submitting delivery QC:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmittingQC(false);
        }
    };

    const handleReturnQCSubmit = async () => {
        setSubmittingQC(true);
        try {
            await submitReturnQC(rentalId, returnQCData);
            await fetchData();
            alert(returnQCData.damageLevel === 'none'
                ? 'Return confirmed! Security deposit will be refunded.'
                : 'Return confirmed. Issue noted.');
        } catch (error) {
            console.error('[OrderStatus] Error submitting return QC:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmittingQC(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getQCDeadline = (deadline: number) => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((deadline - now) / 60000)); // minutes
        if (remaining <= 0) return 'Expired';
        return `${remaining} min remaining`;
    };

    if (loading) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <p>Loading...</p>
                </div>
            </main>
        );
    }

    if (!rental) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <h1>Order Not Found</h1>
                    <p>We couldn't find this rental order.</p>
                    <Button onClick={() => router.push('/')}>Go Home</Button>
                </div>
            </main>
        );
    }

    const canCancel = ['requested', 'paid', 'accepted'].includes(rental.status);
    const isRenter = user?.id === rental.renterUserId;
    const isCurator = user?.id === rental.curatorId;

    // Check if delivery QC is needed (status = delivered, QC not submitted)
    const showDeliveryQC = isRenter &&
        rental.status === 'delivered' &&
        (!rental.deliveryQC || rental.deliveryQC.status === 'pending');

    // Check if return QC is needed (status = return_delivered, QC not submitted)
    const showReturnQC = isCurator &&
        rental.status === 'return_delivered' &&
        (!rental.returnQC || rental.returnQC.status === 'pending');

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.header}>
                    <button onClick={() => router.back()} className={styles.backButton}>
                        ← Back
                    </button>
                    <h1>Order Status</h1>
                    <p className={styles.orderId}>Order ID: {rental.id}</p>
                </div>

                {/* Delivery QC Form - User confirms receipt */}
                {showDeliveryQC && (
                    <section className={styles.qcSection}>
                        <div className={styles.qcHeader}>
                            <Package size={24} />
                            <h2>Confirm Delivery</h2>
                            {rental.deliveryQC?.deadline && (
                                <span className={styles.qcDeadline}>
                                    <Clock size={14} />
                                    {getQCDeadline(rental.deliveryQC.deadline)}
                                </span>
                            )}
                        </div>
                        <p className={styles.qcDescription}>
                            Please confirm that you've received your outfit in good condition.
                            If there's any issue, report it within 30 minutes for a return.
                        </p>

                        <div className={styles.qcActions}>
                            <Button
                                onClick={() => handleDeliveryQCSubmit(true)}
                                disabled={submittingQC}
                            >
                                <CheckCircle size={16} />
                                All Good!
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const desc = prompt('Please describe the issue:');
                                    if (desc) {
                                        setDeliveryQCData({
                                            itemsReceived: false,
                                            conditionOk: false,
                                            sizeOk: false,
                                            issueDescription: desc,
                                            returnRequested: true,
                                        });
                                        handleDeliveryQCSubmit(false);
                                    }
                                }}
                                disabled={submittingQC}
                            >
                                <AlertCircle size={16} />
                                Report Issue
                            </Button>
                        </div>
                    </section>
                )}

                {/* Return QC Form - Curator confirms return */}
                {showReturnQC && (
                    <section className={styles.qcSection}>
                        <div className={styles.qcHeader}>
                            <Package size={24} />
                            <h2>Confirm Return</h2>
                            {rental.returnQC?.deadline && (
                                <span className={styles.qcDeadline}>
                                    <Clock size={14} />
                                    {getQCDeadline(rental.returnQC.deadline)}
                                </span>
                            )}
                        </div>
                        <p className={styles.qcDescription}>
                            Please inspect the returned outfit and confirm its condition.
                            Security deposit will be refunded if no damage is found.
                        </p>

                        <div className={styles.qcForm}>
                            <label className={styles.qcLabel}>
                                Outfit Condition:
                                <select
                                    value={returnQCData.damageLevel}
                                    onChange={(e) => setReturnQCData({
                                        ...returnQCData,
                                        damageLevel: e.target.value as typeof returnQCData.damageLevel,
                                        conditionOk: e.target.value === 'none',
                                    })}
                                    className={styles.qcSelect}
                                >
                                    <option value="none">✅ Perfect - No damage</option>
                                    <option value="minor">⚠️ Minor damage (stains, small tears)</option>
                                    <option value="major">🚨 Major damage (needs repair)</option>
                                    <option value="total">💔 Total loss (unusable)</option>
                                </select>
                            </label>

                            {returnQCData.damageLevel !== 'none' && (
                                <textarea
                                    placeholder="Describe the damage..."
                                    value={returnQCData.issueDescription}
                                    onChange={(e) => setReturnQCData({
                                        ...returnQCData,
                                        issueDescription: e.target.value,
                                    })}
                                    className={styles.qcTextarea}
                                />
                            )}
                        </div>

                        <div className={styles.qcActions}>
                            <Button
                                onClick={handleReturnQCSubmit}
                                disabled={submittingQC}
                            >
                                {submittingQC ? 'Submitting...' : 'Confirm Return'}
                            </Button>
                        </div>
                    </section>
                )}

                {/* QC Status Display */}
                {rental.deliveryQC && rental.deliveryQC.status !== 'pending' && (
                    <section className={styles.qcStatus}>
                        <h3>Delivery Check Status</h3>
                        <div className={`${styles.statusBadge} ${rental.deliveryQC.status === 'approved' ? styles.approved : styles.issue}`}>
                            {rental.deliveryQC.status === 'approved' ? '✅ Confirmed by user' : '⚠️ Issue reported'}
                        </div>
                        {rental.deliveryQC.issueDescription && (
                            <p className={styles.issueNote}>Issue: {rental.deliveryQC.issueDescription}</p>
                        )}
                    </section>
                )}

                {rental.returnQC && rental.returnQC.status !== 'pending' && (
                    <section className={styles.qcStatus}>
                        <h3>Return Check Status</h3>
                        <div className={`${styles.statusBadge} ${rental.returnQC.damageLevel === 'none' ? styles.approved : styles.issue}`}>
                            {rental.returnQC.damageLevel === 'none'
                                ? '✅ No damage - Deposit refunded'
                                : `⚠️ ${rental.returnQC.damageLevel} damage reported`}
                        </div>
                        {rental.returnQC.issueDescription && (
                            <p className={styles.issueNote}>Note: {rental.returnQC.issueDescription}</p>
                        )}
                    </section>
                )}

                {/* Rental Summary */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Rental Summary</h2>
                    <div className={styles.summaryCard}>
                        {outfit ? (
                            <img
                                src={outfit.images[0]}
                                alt={outfit.title}
                                className={styles.outfitImage}
                            />
                        ) : (
                            <div className={styles.outfitImagePlaceholder}>
                                👗
                            </div>
                        )}
                        <div className={styles.summaryDetails}>
                            <h3 className={styles.outfitTitle}>
                                {outfit?.title || 'Outfit'}
                            </h3>
                            <div className={styles.detailRow}>
                                <span>Rental Period:</span>
                                <span>
                                    {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Nights:</span>
                                <span>{rental.nights}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Total Amount:</span>
                                <span className={styles.amount}>₹{rental.pricing.total}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Security Deposit:</span>
                                <span>₹{rental.pricing.securityDeposit}
                                    {rental.returnQC?.depositRefunded && ' (Refunded)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Status Timeline */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Order Progress</h2>
                    <StatusTimeline timeline={rental.timeline} currentStatus={rental.status} />
                </section>

                {/* Delivery Tracking */}
                {rental.tracking && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Delivery Tracking</h2>
                        <div className={styles.trackingCard}>
                            <div className={styles.trackingRow}>
                                <span>Courier:</span>
                                <span>{rental.tracking.courierName || 'Not assigned yet'}</span>
                            </div>
                            <div className={styles.trackingRow}>
                                <span>Tracking Number:</span>
                                <span>{rental.tracking.trackingNumber || 'Not available yet'}</span>
                            </div>
                            {rental.tracking.estimatedDelivery && (
                                <div className={styles.trackingRow}>
                                    <span>Estimated Delivery:</span>
                                    <span>{formatDate(rental.tracking.estimatedDelivery)}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Delivery Address */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Delivery Address</h2>
                    <div className={styles.addressCard}>
                        <p className={styles.addressName}>{rental.deliveryAddress.fullName}</p>
                        <p>{rental.deliveryAddress.addressLine1}</p>
                        <p>
                            {rental.deliveryAddress.city}, {rental.deliveryAddress.state} -{' '}
                            {rental.deliveryAddress.zipCode}
                        </p>
                        <p>Phone: {rental.deliveryAddress.phone}</p>
                    </div>
                </section>

                {/* Support Contact */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Need Help?</h2>
                    <div className={styles.supportCard}>
                        <p>Contact our support team:</p>
                        <div className={styles.contactRow}>
                            <span>📧 Email:</span>
                            <a href="mailto:hi@closetshare.in">hi@closetshare.in</a>
                        </div>
                        <div className={styles.contactRow}>
                            <span>💬 WhatsApp:</span>
                            <a
                                href="https://wa.me/6590574472"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                +65 90574472
                            </a>
                        </div>
                    </div>
                </section>

                {/* Cancel Button */}
                {canCancel && isRenter && (
                    <div className={styles.actions}>
                        <Button
                            variant="secondary"
                            onClick={handleCancelRental}
                            disabled={cancelling}
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel Rental'}
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
}
