import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface ErrorLog {
    id?: string;
    timestamp: number;
    message: string;
    stack?: string;
    userId?: string;
    userEmail?: string;
    route?: string;
    userAgent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'runtime' | 'network' | 'payment' | 'auth' | 'data' | 'other';
    metadata?: Record<string, any>;
    resolved?: boolean;
}

/**
 * Log an error to Firestore for admin review
 */
export const logError = async (
    error: Error | string,
    options: {
        userId?: string;
        userEmail?: string;
        severity?: ErrorLog['severity'];
        category?: ErrorLog['category'];
        metadata?: Record<string, any>;
    } = {}
) => {
    try {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const errorStack = typeof error === 'string' ? undefined : error.stack;

        const errorLog: Omit<ErrorLog, 'id'> = {
            timestamp: Date.now(),
            message: errorMessage,
            stack: errorStack,
            userId: options.userId,
            userEmail: options.userEmail,
            route: typeof window !== 'undefined' ? window.location.pathname : undefined,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
            severity: options.severity || 'medium',
            category: options.category || 'other',
            metadata: options.metadata,
            resolved: false,
        };

        await addDoc(collection(db, 'errorLogs'), {
            ...errorLog,
            createdAt: serverTimestamp(),
        });

        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('[Error Logger]', errorLog);
        }
    } catch (loggingError) {
        // If error logging fails, at least log to console
        console.error('[Error Logger] Failed to log error:', loggingError);
        console.error('[Original Error]', error);
    }
};

/**
 * Log a critical error (payment, auth failures, etc.)
 */
export const logCriticalError = async (
    error: Error | string,
    userId?: string,
    userEmail?: string,
    metadata?: Record<string, any>
) => {
    return logError(error, {
        userId,
        userEmail,
        severity: 'critical',
        metadata,
    });
};

/**
 * Log a payment error
 */
export const logPaymentError = async (
    error: Error | string,
    userId?: string,
    userEmail?: string,
    metadata?: Record<string, any>
) => {
    return logError(error, {
        userId,
        userEmail,
        severity: 'critical',
        category: 'payment',
        metadata,
    });
};

/**
 * Log a network/API error
 */
export const logNetworkError = async (
    error: Error | string,
    userId?: string,
    userEmail?: string,
    metadata?: Record<string, any>
) => {
    return logError(error, {
        userId,
        userEmail,
        severity: 'medium',
        category: 'network',
        metadata,
    });
};

/**
 * Log a data fetching error
 */
export const logDataError = async (
    error: Error | string,
    userId?: string,
    userEmail?: string,
    metadata?: Record<string, any>
) => {
    return logError(error, {
        userId,
        userEmail,
        severity: 'medium',
        category: 'data',
        metadata,
    });
};
