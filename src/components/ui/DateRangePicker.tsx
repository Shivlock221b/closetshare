'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DateRangePicker.module.css';

interface DateRangePickerProps {
    blockedDates: number[]; // Array of blocked date timestamps
    onDateSelect: (startDate: Date, endDate: Date, nights: number) => void;
    perNightPrice: number;
    minNights?: number;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Platform fee per night
const PLATFORM_FEE_PER_NIGHT = 10;
const DELIVERY_FEE = 50;

// Convert date to midnight UTC timestamp for comparison
const toDateKey = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

// Check if a date is blocked
const isDateBlocked = (date: Date, blockedDates: number[]): boolean => {
    const dateKey = toDateKey(date);
    return blockedDates.includes(dateKey);
};

// Get all dates between start and end (inclusive)
const getDatesBetween = (start: Date, end: Date): Date[] => {
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

// Check if date range has any blocked dates
const hasBlockedDatesInRange = (start: Date, end: Date, blockedDates: number[]): boolean => {
    const dates = getDatesBetween(start, end);
    return dates.some(date => isDateBlocked(date, blockedDates));
};

// Calculate nights between two dates
const calculateNights = (start: Date, end: Date): number => {
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    blockedDates,
    onDateSelect,
    perNightPrice,
    minNights = 1,
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

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentMonth]);

    const handleDateClick = (date: Date) => {
        if (date < today) return;
        if (isDateBlocked(date, blockedDates)) return;

        if (!startDate || (startDate && endDate)) {
            // Start new selection
            setStartDate(date);
            setEndDate(null);
        } else {
            // Complete selection
            if (date < startDate) {
                // Clicked before start, swap
                if (!hasBlockedDatesInRange(date, startDate, blockedDates)) {
                    const nights = calculateNights(date, startDate);
                    if (nights >= minNights) {
                        setEndDate(startDate);
                        setStartDate(date);
                        onDateSelect(date, startDate, nights);
                    }
                }
            } else {
                // Clicked after start
                if (!hasBlockedDatesInRange(startDate, date, blockedDates)) {
                    const nights = calculateNights(startDate, date);
                    if (nights >= minNights) {
                        setEndDate(date);
                        onDateSelect(startDate, date, nights);
                    }
                }
            }
        }
    };

    const isInRange = (date: Date): boolean => {
        if (!startDate) return false;
        const end = endDate || hoverDate;
        if (!end) return false;

        const start = startDate < end ? startDate : end;
        const finish = startDate < end ? end : startDate;

        return date >= start && date <= finish;
    };

    const isStartDate = (date: Date): boolean => {
        return startDate ? toDateKey(date) === toDateKey(startDate) : false;
    };

    const isEndDate = (date: Date): boolean => {
        return endDate ? toDateKey(date) === toDateKey(endDate) : false;
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Calculate pricing
    const nights = startDate && endDate ? calculateNights(startDate, endDate) : 0;
    const rentalFee = nights * perNightPrice;
    const securityDeposit = perNightPrice; // 1 night
    const platformFee = nights * PLATFORM_FEE_PER_NIGHT;
    const deliveryTotal = DELIVERY_FEE * 2; // Both ways
    const total = rentalFee + securityDeposit + platformFee + deliveryTotal;

    return (
        <div className={styles.container}>
            <div className={styles.calendar}>
                <div className={styles.header}>
                    <button onClick={prevMonth} className={styles.navBtn}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className={styles.monthYear}>
                        {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button onClick={nextMonth} className={styles.navBtn}>
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
                        const isBlocked = isDateBlocked(date, blockedDates);
                        const inRange = isInRange(date);
                        const isStart = isStartDate(date);
                        const isEnd = isEndDate(date);

                        return (
                            <button
                                key={date.getTime()}
                                className={`
                                    ${styles.day}
                                    ${isPast ? styles.past : ''}
                                    ${isBlocked ? styles.blocked : ''}
                                    ${inRange ? styles.inRange : ''}
                                    ${isStart ? styles.start : ''}
                                    ${isEnd ? styles.end : ''}
                                `}
                                onClick={() => handleDateClick(date)}
                                onMouseEnter={() => setHoverDate(date)}
                                onMouseLeave={() => setHoverDate(null)}
                                disabled={isPast || isBlocked}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {startDate && endDate && (
                <div className={styles.summary}>
                    <div className={styles.dateRange}>
                        <span>{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span className={styles.arrow}>→</span>
                        <span>{endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span className={styles.nights}>({nights} nights)</span>
                    </div>

                    <div className={styles.priceBreakdown}>
                        <div className={styles.priceRow}>
                            <span>₹{perNightPrice} × {nights} nights</span>
                            <span>₹{rentalFee}</span>
                        </div>
                        <div className={styles.priceRow}>
                            <span>Security Deposit (refundable)</span>
                            <span>₹{securityDeposit}</span>
                        </div>
                        <div className={styles.priceRow}>
                            <span>Platform Fee (₹10 × {nights})</span>
                            <span>₹{platformFee}</span>
                        </div>
                        <div className={styles.priceRow}>
                            <span>Delivery (both ways)</span>
                            <span>₹{deliveryTotal}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <span>₹{total}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.available}`} />
                    Available
                </div>
                <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.unavailable}`} />
                    Booked
                </div>
            </div>
        </div>
    );
};
