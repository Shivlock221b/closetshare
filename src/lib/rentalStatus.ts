import { RentalStatus } from '@/types';

/**
 * Validates if a rental status transition is allowed.
 * Prevents invalid state changes (e.g., jumping from 'requested' to 'completed').
 */
export const isValidStatusTransition = (
    currentStatus: RentalStatus,
    newStatus: RentalStatus
): boolean => {
    const transitions: Record<RentalStatus, RentalStatus[]> = {
        requested: ['accepted', 'rejected', 'cancelled'],
        accepted: ['paid', 'cancelled'],
        rejected: [],
        paid: ['in_transit', 'cancelled'],
        in_transit: ['in_use', 'cancelled'],
        in_use: ['returned', 'cancelled'],
        returned: ['completed'],
        completed: [],
        cancelled: [],
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Updates a rental status with validation.
 * Returns the new status if valid, otherwise throws an error.
 */
export const updateRentalStatus = (
    currentStatus: RentalStatus,
    newStatus: RentalStatus
): RentalStatus => {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new Error(
            `Invalid status transition from "${currentStatus}" to "${newStatus}"`
        );
    }
    return newStatus;
};
