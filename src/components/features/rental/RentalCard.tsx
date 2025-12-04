import React from 'react';
import Link from 'next/link';
import styles from './RentalCard.module.css';
import { Rental } from '@/types';

interface RentalCardProps {
    rental: Rental;
    outfitTitle: string;
    outfitImage: string;
    showActions?: boolean;
    onAccept?: (rentalId: string) => void;
    onReject?: (rentalId: string) => void;
}

const statusColors: Record<string, string> = {
    requested: '#FFA500',
    paid: '#4CAF50',
    accepted: '#2196F3',
    rejected: '#F44336',
    in_transit: '#9C27B0',
    in_use: '#00BCD4',
    returned: '#8BC34A',
    completed: '#4CAF50',
    cancelled: '#757575',
};

const statusLabels: Record<string, string> = {
    requested: 'Requested',
    paid: 'Paid',
    accepted: 'Accepted',
    rejected: 'Rejected',
    in_transit: 'In Transit',
    in_use: 'In Use',
    returned: 'Returned',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export const RentalCard: React.FC<RentalCardProps> = ({
    rental,
    outfitTitle,
    outfitImage,
    showActions = false,
    onAccept,
    onReject,
}) => {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <img src={outfitImage} alt={outfitTitle} className={styles.image} />
                <div
                    className={styles.statusBadge}
                    style={{ backgroundColor: statusColors[rental.status] }}
                >
                    {statusLabels[rental.status]}
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{outfitTitle}</h3>

                <div className={styles.details}>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Renter:</span>
                        <span>{rental.renterName}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Period:</span>
                        <span>
                            {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                        </span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Nights:</span>
                        <span>{rental.nights}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Rental Fee:</span>
                        <span className={styles.amount}>₹{rental.pricing.rentalFee}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Your Earnings:</span>
                        <span className={styles.earnings}>₹{rental.curatorEarnings}</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href={`/order-status/${rental.id}`}>
                        <button className={styles.viewButton}>View Details</button>
                    </Link>

                    {showActions && rental.status === 'paid' && (
                        <>
                            {onAccept && (
                                <button
                                    className={styles.acceptButton}
                                    onClick={() => onAccept(rental.id)}
                                >
                                    Accept
                                </button>
                            )}
                            {onReject && (
                                <button
                                    className={styles.rejectButton}
                                    onClick={() => onReject(rental.id)}
                                >
                                    Reject
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
