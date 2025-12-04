import React from 'react';
import styles from './StatusTimeline.module.css';
import { RentalStatus, TimelineEntry } from '@/types';

interface StatusTimelineProps {
    timeline: TimelineEntry[];
    currentStatus: RentalStatus;
}

const statusLabels: Record<RentalStatus, string> = {
    requested: 'Rental Requested',
    paid: 'Payment Confirmed',
    accepted: 'Accepted by Curator',
    rejected: 'Rejected',
    in_transit: 'In Transit',
    in_use: 'In Use',
    returned: 'Returned',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const statusOrder: RentalStatus[] = [
    'requested',
    'paid',
    'accepted',
    'in_transit',
    'in_use',
    'returned',
    'completed',
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ timeline, currentStatus }) => {
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusIndex = (status: RentalStatus) => {
        return statusOrder.indexOf(status);
    };

    const currentIndex = getStatusIndex(currentStatus);

    return (
        <div className={styles.container}>
            <div className={styles.timeline}>
                {statusOrder.map((status, index) => {
                    const entry = timeline.find(t => t.status === status);
                    const isCompleted = index <= currentIndex;
                    const isCurrent = status === currentStatus;

                    return (
                        <div key={status} className={styles.step}>
                            <div className={styles.stepContent}>
                                <div
                                    className={`${styles.dot} ${isCompleted ? styles.dotCompleted : styles.dotPending
                                        } ${isCurrent ? styles.dotCurrent : ''}`}
                                >
                                    {isCompleted && (
                                        <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </div>
                                {index < statusOrder.length - 1 && (
                                    <div
                                        className={`${styles.line} ${isCompleted ? styles.lineCompleted : styles.linePending
                                            }`}
                                    />
                                )}
                            </div>

                            <div className={styles.stepInfo}>
                                <div className={`${styles.label} ${isCurrent ? styles.labelCurrent : ''}`}>
                                    {statusLabels[status]}
                                </div>
                                {entry && (
                                    <div className={styles.timestamp}>{formatDate(entry.timestamp)}</div>
                                )}
                                {entry?.note && <div className={styles.note}>{entry.note}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
