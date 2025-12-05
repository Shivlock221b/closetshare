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
        requested: ['paid', 'cancelled'],
        paid: ['accepted', 'rejected', 'cancelled'],
        accepted: ['shipped', 'cancelled'],
        rejected: [],
        shipped: ['delivered', 'cancelled'],
        delivered: ['in_use', 'disputed', 'cancelled'],
        in_use: ['return_shipped', 'disputed'],
        return_shipped: ['return_delivered'],
        return_delivered: ['completed', 'disputed'],
        completed: [],
        cancelled: [],
        disputed: ['completed', 'cancelled'],
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
