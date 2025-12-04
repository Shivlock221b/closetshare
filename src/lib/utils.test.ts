import { describe, it, expect } from 'vitest';
import { calculateRentalTotal, formatCurrency } from './utils';

describe('calculateRentalTotal', () => {
    it('should calculate total correctly', () => {
        const total = calculateRentalTotal(3, 450, 1000, 50);
        // 3 * 450 = 1350
        // 1350 + 1000 + 50 = 2400
        expect(total).toBe(2400);
    });

    it('should return 0 for 0 days', () => {
        const total = calculateRentalTotal(0, 450, 1000, 50);
        expect(total).toBe(0);
    });
});

describe('formatCurrency', () => {
    it('should format INR correctly', () => {
        // Note: The exact output depends on the locale, but we check for the symbol
        const formatted = formatCurrency(1000);
        expect(formatted).toContain('₹');
        expect(formatted).toContain('1,000');
    });
});
