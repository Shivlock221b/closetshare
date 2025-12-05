import React from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
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
    shipped: 'Shipped',
    delivered: 'Delivered',
    in_use: 'In Use',
    return_shipped: 'Return Shipped',
    return_delivered: 'Return Received',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Issue Reported - Under Investigation',
};

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

    // Display timeline entries in order they occurred (sorted by timestamp)
    const sortedTimeline = [...timeline].sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className={styles.container}>
            <div className={styles.timeline}>
                {sortedTimeline.map((entry, index) => {
                    const isLast = index === sortedTimeline.length - 1;
                    const isCurrent = entry.status === currentStatus;
                    const isDisputed = entry.status === 'disputed';

                    return (
                        <div key={`${entry.status}-${entry.timestamp}`} className={styles.step}>
                            <div className={styles.stepContent}>
                                <div
                                    className={`${styles.dot} ${styles.dotCompleted} ${isCurrent ? styles.dotCurrent : ''} ${isDisputed ? styles.dotDisputed : ''}`}
                                >
                                    {isDisputed ? (
                                        <AlertTriangle size={12} />
                                    ) : (
                                        <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </div>
                                {!isLast && (
                                    <div className={`${styles.line} ${styles.lineCompleted}`} />
                                )}
                            </div>

                            <div className={styles.stepInfo}>
                                <div className={`${styles.label} ${isCurrent ? styles.labelCurrent : ''} ${isDisputed ? styles.labelDisputed : ''}`}>
                                    {statusLabels[entry.status] || entry.status}
                                </div>
                                <div className={styles.timestamp}>{formatDate(entry.timestamp)}</div>
                                {entry.note && (
                                    <div className={styles.note}>
                                        <span className={styles.noteIcon}>💬</span> {entry.note}
                                    </div>
                                )}
                                {entry.link && (
                                    <a
                                        href={entry.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.link}
                                    >
                                        <ExternalLink size={14} />
                                        Open Link
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
