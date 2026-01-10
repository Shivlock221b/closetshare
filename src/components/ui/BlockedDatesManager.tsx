'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import styles from './BlockedDatesManager.module.css';

interface BlockedDatesManagerProps {
    blockedDates: number[]; // Array of blocked date timestamps
    onChange: (newBlockedDates: number[]) => void;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Convert date to midnight UTC timestamp for comparison
const toDateKey = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

export const BlockedDatesManager: React.FC<BlockedDatesManagerProps> = ({
    blockedDates,
    onChange,
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get calendar days for current month
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: (Date | null)[] = [];

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentMonth]);

    const handleDateClick = (date: Date) => {
        if (date < today) return;
        // Unlike rental picker, we ALLOW clicking on blocked dates (maybe to unblock? 
        // For now, let's keep selection logic separate from existing blocks)

        // If clicking on the start date again, clear selection
        if (startDate && toDateKey(date) === toDateKey(startDate)) {
            setStartDate(null);
            setEndDate(null);
            return;
        }

        // If clicking on the end date again, clear just the end date
        if (endDate && toDateKey(date) === toDateKey(endDate)) {
            setEndDate(null);
            return;
        }

        if (!startDate || (startDate && endDate)) {
            // Start new selection
            setStartDate(date);
            setEndDate(null);
        } else {
            // Complete selection
            if (date < startDate) {
                setEndDate(startDate);
                setStartDate(date);
            } else {
                setEndDate(date);
            }
        }
    };

    const handleBlockDates = () => {
        if (!startDate) return;

        const datesToBlock: number[] = [];
        const start = startDate;
        const end = endDate || startDate; // Single day block allowed

        const current = new Date(start);
        while (current <= end) {
            datesToBlock.push(toDateKey(current));
            current.setDate(current.getDate() + 1);
        }

        // Merge with existing
        const newBlocked = [...new Set([...blockedDates, ...datesToBlock])];
        onChange(newBlocked);

        // Clear selection
        setStartDate(null);
        setEndDate(null);
    };

    const handleUnblockRange = (rangeStart: number, rangeEnd: number) => {
        // Remove dates within this range
        const datesToRemove: number[] = [];
        const current = new Date(rangeStart);
        const end = new Date(rangeEnd);

        while (current <= end) {
            datesToRemove.push(toDateKey(current));
            current.setDate(current.getDate() + 1);
        }

        const newBlocked = blockedDates.filter(d => !datesToRemove.includes(d));
        onChange(newBlocked);
    };

    // Calculate ranges from blockedDates for display
    const blockedRanges = useMemo(() => {
        if (blockedDates.length === 0) return [];

        const sorted = [...blockedDates].sort((a, b) => a - b);
        const ranges: { start: number; end: number }[] = [];
        let rangeStart = sorted[0];
        let prev = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const diffDays = (current - prev) / (1000 * 60 * 60 * 24);

            if (diffDays > 1) {
                // Gap found, close previous range
                ranges.push({ start: rangeStart, end: prev });
                rangeStart = current;
            }
            prev = current;
        }
        ranges.push({ start: rangeStart, end: prev });

        return ranges;
    }, [blockedDates]);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const isDateBlocked = (date: Date) => blockedDates.includes(toDateKey(date));

    const isInSelection = (date: Date) => {
        if (!startDate) return false;
        const end = endDate || hoverDate || startDate;
        const s = startDate < end ? startDate : end;
        const e = startDate < end ? end : startDate;
        return date >= s && date <= e;
    };

    const isStartDate = (date: Date) => startDate && toDateKey(date) === toDateKey(startDate);
    const isEndDate = (date: Date) => endDate && toDateKey(date) === toDateKey(endDate);

    return (
        <div className={styles.container}>
            <div className={styles.calendar}>
                <div className={styles.header}>
                    <button type="button" onClick={prevMonth} className={styles.navBtn}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className={styles.monthYear}>
                        {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button type="button" onClick={nextMonth} className={styles.navBtn}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className={styles.weekDays}>
                    {DAY_NAMES.map(day => (
                        <div key={day} className={styles.weekDay}>{day}</div>
                    ))}
                </div>

                <div className={styles.days}>
                    {calendarDays.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className={styles.emptyDay} />;
                        }

                        const isPast = date < today;
                        const isBlocked = isDateBlocked(date);
                        const isSelected = isInSelection(date);
                        const isStart = isStartDate(date);
                        const isEnd = isEndDate(date);

                        return (
                            <button
                                type="button"
                                key={date.getTime()}
                                className={`
                                    ${styles.day}
                                    ${isPast ? styles.past : ''}
                                    ${isBlocked ? styles.blocked : ''}
                                    ${isSelected ? styles.selected : ''}
                                    ${isStart ? styles.start : ''}
                                    ${isEnd ? styles.end : ''}
                                `}
                                onClick={() => handleDateClick(date)}
                                onMouseEnter={() => setHoverDate(date)}
                                onMouseLeave={() => setHoverDate(null)}
                                disabled={isPast}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {startDate && (
                <div className={styles.actions}>
                    <p>
                        Selected: {startDate.toLocaleDateString()}
                        {endDate && ` - ${endDate.toLocaleDateString()}`}
                    </p>
                    <button
                        type="button"
                        className={styles.blockBtn}
                        onClick={handleBlockDates}
                    >
                        Mark as Unavailable
                    </button>
                </div>
            )}

            {blockedRanges.length > 0 && (
                <div className={styles.blockedList}>
                    <h4>Unavailable Periods</h4>
                    <div className={styles.ranges}>
                        {blockedRanges.map((range, idx) => (
                            <div key={idx} className={styles.rangeItem}>
                                <span>
                                    {new Date(range.start).toLocaleDateString()}
                                    {range.start !== range.end && ` - ${new Date(range.end).toLocaleDateString()}`}
                                </span>
                                <button
                                    type="button"
                                    className={styles.removeBtn}
                                    onClick={() => handleUnblockRange(range.start, range.end)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
