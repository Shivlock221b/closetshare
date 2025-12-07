'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Clock, Package } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { IssueReportForm, IssueReportData } from '@/components/ui/IssueReportForm';
import { RatingForm } from '@/components/ui/RatingForm';
import { RatingDisplay } from '@/components/ui/RatingDisplay';
import { useAuth } from '@/contexts/AuthContext';
import {
    getRentalById,
    getOutfitById,
    updateRentalStatus,
    submitDeliveryQC,
    submitReturnQC,
    submitIssueReport,
    getRatingsForRental,
    submitRating
} from '@/lib/firestore';
import { Rental, Outfit, Rating } from '@/types';
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
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [issueFormType, setIssueFormType] = useState<'delivery' | 'return'>('delivery');
    const [curatorRating, setCuratorRating] = useState<Rating | null>(null);
    const [userRating, setUserRating] = useState<Rating | null>(null);


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

                // Fetch ratings if rental is completed
                if (rentalData.status === 'completed') {
                    try {
                        const ratings = await getRatingsForRental(rentalId);
                        setCuratorRating(ratings.curatorRating || null);
                        setUserRating(ratings.userRating || null);
                    } catch (ratingsError) {
                        console.warn('[OrderStatus] Could not fetch ratings:', ratingsError);
                    }
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

    const handleDeliveryQCSubmit = async (allOk: boolean, issueData?: IssueReportData) => {
        setSubmittingQC(true);
        try {
            await submitDeliveryQC(rentalId, {
                itemsReceived: allOk ? true : false,
                conditionOk: allOk ? true : false,
                sizeOk: allOk ? true : false,
                issueDescription: allOk ? '' : issueData?.description || '',
                returnRequested: allOk ? false : true,
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

    const handleIssueReportSubmit = async (data: IssueReportData) => {
        if (!user) {
            alert('You must be logged in to report an issue.');
            return;
        }

        setSubmittingQC(true);

        try {
            // Determine severity level for the note
            const getSeverityLabel = (category: string): string => {
                if (issueFormType === 'delivery') {
                    if (category === 'damaged' || category === 'wrong_item') return 'Major';
                    if (category === 'sizing' || category === 'quality') return 'Minor';
                    return 'Minor';
                } else {
                    if (category === 'damaged' || category === 'missing_item') return 'Major';
                    if (category === 'stains') return 'Minor';
                    return 'Minor';
                }
            };

            const severityLabel = getSeverityLabel(data.category);

            // Always create an issue report for admin tracking
            await submitIssueReport(rentalId, {
                reporterId: user.id,
                reporterType: issueFormType === 'delivery' ? 'user' : 'curator',
                category: data.category,
                description: `[${severityLabel} Issue] ${data.description}`,
                imageUrls: data.imageUrls,
            });

            // Also update the appropriate QC data
            if (issueFormType === 'delivery') {
                await submitDeliveryQC(rentalId, {
                    itemsReceived: false,
                    conditionOk: false,
                    sizeOk: false,
                    issueDescription: data.description,
                    returnRequested: true,
                });
            } else {
                const damageLevel = data.category === 'damaged' ? 'major' :
                                  data.category === 'stains' ? 'minor' :
                                  data.category === 'missing_item' ? 'total' : 'minor';

                await submitReturnQC(rentalId, {
                    conditionOk: false,
                    damageLevel: damageLevel as 'none' | 'minor' | 'major' | 'total',
                    issueDescription: data.description,
                });
            }

            await fetchData();
            alert('Issue reported successfully. Our team will review and contact you shortly.');
        } catch (error) {
            console.error('[OrderStatus] Error submitting issue report:', error);
            alert('Failed to submit issue. Please try again.');
        } finally {
            setSubmittingQC(false);
        }

        setShowIssueForm(false);
    };

    const handleReturnQCSubmit = async () => {
        setSubmittingQC(true);
        try {
            await submitReturnQC(rentalId, {
                conditionOk: true,
                damageLevel: 'none',
                issueDescription: '',
            });
            await fetchData();
            alert('Return confirmed! Security deposit will be refunded.');
        } catch (error) {
            console.error('[OrderStatus] Error submitting return QC:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmittingQC(false);
        }
    };

    const handleCuratorRatingSubmit = async (data: { stars: number; comment: string }) => {
        try {
            if (!rental || !user) return;

            await submitRating({
                rentalId,
                ratingType: 'curator_rating',
                raterId: user.id,
                ratedUserId: rental.curatorId,
                stars: data.stars,
                comment: data.comment,
            });
            await fetchData();
            alert('Thank you for your rating!');
        } catch (error) {
            console.error('[OrderStatus] Error submitting curator rating:', error);
            throw error;
        }
    };

    const handleUserRatingSubmit = async (data: { stars: number; comment: string }) => {
        try {
            if (!rental || !user) return;

            await submitRating({
                rentalId,
                ratingType: 'user_rating',
                raterId: user.id,
                ratedUserId: rental.renterUserId,
                stars: data.stars,
                comment: data.comment,
            });
            await fetchData();
            alert('Thank you for your rating!');
        } catch (error) {
            console.error('[OrderStatus] Error submitting user rating:', error);
            throw error;
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
                    <div className={styles.loadingState}>
                        <LoadingSpinner size="lg" text="Loading order..." />
                    </div>
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
                                    setIssueFormType('delivery');
                                    setShowIssueForm(true);
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

                        <div className={styles.qcActions}>
                            <Button
                                onClick={handleReturnQCSubmit}
                                disabled={submittingQC}
                            >
                                <CheckCircle size={16} />
                                No Issues - Confirm Return
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIssueFormType('return');
                                    setShowIssueForm(true);
                                }}
                                disabled={submittingQC}
                            >
                                <AlertCircle size={16} />
                                Report Issue
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

                {/* Rating Forms - Show only when rental is completed */}
                {rental.status === 'completed' && (
                    <>
                        {/* Curator Rating (Renter rates Curator) */}
                        {isRenter && !curatorRating && outfit && (
                            <RatingForm
                                rentalId={rentalId}
                                ratingType="curator_rating"
                                ratedUserId={rental.curatorId}
                                ratedUserName={outfit.curatorId}
                                onSubmit={handleCuratorRatingSubmit}
                                onSkip={() => {}}
                            />
                        )}

                        {/* Display submitted curator rating */}
                        {isRenter && curatorRating && (
                            <RatingDisplay
                                rating={curatorRating}
                                title="Your Rating for the Curator"
                            />
                        )}

                        {/* User Rating (Curator rates Renter) */}
                        {isCurator && !userRating && (
                            <RatingForm
                                rentalId={rentalId}
                                ratingType="user_rating"
                                ratedUserId={rental.renterUserId}
                                ratedUserName={rental.renterName}
                                onSubmit={handleUserRatingSubmit}
                                onSkip={() => {}}
                            />
                        )}

                        {/* Display submitted user rating */}
                        {isCurator && userRating && (
                            <RatingDisplay
                                rating={userRating}
                                title={`Your Rating for ${rental.renterName}`}
                            />
                        )}
                    </>
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

                {/* Issue Report Form Modal */}
                {showIssueForm && (
                    <IssueReportForm
                        rentalId={rentalId}
                        reporterType={issueFormType === 'delivery' ? 'user' : 'curator'}
                        onSubmit={handleIssueReportSubmit}
                        onCancel={() => setShowIssueForm(false)}
                    />
                )}
            </div>
        </main>
    );
}
