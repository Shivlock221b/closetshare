import { describe, it, expect } from 'vitest';
import { isValidStatusTransition, updateRentalStatus } from './rentalStatus';

describe('isValidStatusTransition', () => {
    it('should allow valid transitions', () => {
        expect(isValidStatusTransition('requested', 'accepted')).toBe(true);
        expect(isValidStatusTransition('accepted', 'paid')).toBe(true);
        expect(isValidStatusTransition('paid', 'in_transit')).toBe(true);
        expect(isValidStatusTransition('in_transit', 'in_use')).toBe(true);
        expect(isValidStatusTransition('in_use', 'returned')).toBe(true);
        expect(isValidStatusTransition('returned', 'completed')).toBe(true);
    });

    it('should reject invalid transitions', () => {
        expect(isValidStatusTransition('requested', 'completed')).toBe(false);
        expect(isValidStatusTransition('completed', 'in_use')).toBe(false);
        expect(isValidStatusTransition('rejected', 'accepted')).toBe(false);
    });

    it('should allow cancellation from most states', () => {
        expect(isValidStatusTransition('requested', 'cancelled')).toBe(true);
        expect(isValidStatusTransition('accepted', 'cancelled')).toBe(true);
        expect(isValidStatusTransition('paid', 'cancelled')).toBe(true);
    });
});

describe('updateRentalStatus', () => {
    it('should return new status for valid transitions', () => {
        expect(updateRentalStatus('requested', 'accepted')).toBe('accepted');
    });

    it('should throw error for invalid transitions', () => {
        expect(() => updateRentalStatus('requested', 'completed')).toThrow();
    });
});
