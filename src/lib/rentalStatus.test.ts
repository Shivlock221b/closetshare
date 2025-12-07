import { describe, it, expect } from 'vitest';
import { isValidStatusTransition, updateRentalStatus } from './rentalStatus';

describe('isValidStatusTransition', () => {
    it('should allow valid transitions in happy path', () => {
        expect(isValidStatusTransition('requested', 'paid')).toBe(true);
        expect(isValidStatusTransition('paid', 'accepted')).toBe(true);
        expect(isValidStatusTransition('accepted', 'shipped')).toBe(true);
        expect(isValidStatusTransition('shipped', 'delivered')).toBe(true);
        expect(isValidStatusTransition('delivered', 'in_use')).toBe(true);
        expect(isValidStatusTransition('in_use', 'return_shipped')).toBe(true);
        expect(isValidStatusTransition('return_shipped', 'return_delivered')).toBe(true);
        expect(isValidStatusTransition('return_delivered', 'completed')).toBe(true);
    });

    it('should allow rejection after payment', () => {
        expect(isValidStatusTransition('paid', 'rejected')).toBe(true);
    });

    it('should allow dispute transitions', () => {
        expect(isValidStatusTransition('delivered', 'disputed')).toBe(true);
        expect(isValidStatusTransition('in_use', 'disputed')).toBe(true);
        expect(isValidStatusTransition('return_delivered', 'disputed')).toBe(true);
        expect(isValidStatusTransition('disputed', 'completed')).toBe(true);
        expect(isValidStatusTransition('disputed', 'cancelled')).toBe(true);
    });

    it('should reject invalid transitions', () => {
        expect(isValidStatusTransition('requested', 'accepted')).toBe(false);
        expect(isValidStatusTransition('requested', 'completed')).toBe(false);
        expect(isValidStatusTransition('completed', 'in_use')).toBe(false);
        expect(isValidStatusTransition('rejected', 'accepted')).toBe(false);
    });

    it('should allow cancellation from most states', () => {
        expect(isValidStatusTransition('requested', 'cancelled')).toBe(true);
        expect(isValidStatusTransition('paid', 'cancelled')).toBe(true);
        expect(isValidStatusTransition('accepted', 'cancelled')).toBe(true);
        expect(isValidStatusTransition('shipped', 'cancelled')).toBe(true);
        expect(isValidStatusTransition('delivered', 'cancelled')).toBe(true);
    });

    it('should not allow transitions from terminal states', () => {
        expect(isValidStatusTransition('completed', 'paid')).toBe(false);
        expect(isValidStatusTransition('cancelled', 'paid')).toBe(false);
        expect(isValidStatusTransition('rejected', 'paid')).toBe(false);
    });
});

describe('updateRentalStatus', () => {
    it('should return new status for valid transitions', () => {
        expect(updateRentalStatus('requested', 'paid')).toBe('paid');
        expect(updateRentalStatus('paid', 'accepted')).toBe('accepted');
    });

    it('should throw error for invalid transitions', () => {
        expect(() => updateRentalStatus('requested', 'completed')).toThrow();
        expect(() => updateRentalStatus('requested', 'accepted')).toThrow();
        expect(() => updateRentalStatus('completed', 'in_use')).toThrow();
    });
});
