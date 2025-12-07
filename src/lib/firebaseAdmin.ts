import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@/types';

let adminApp: App;

export function getAdminApp() {
    if (getApps().length === 0) {
        // Initialize Firebase Admin SDK
        // In production, use service account credentials
        // For development, use application default credentials
        try {
            adminApp = initializeApp({
                credential: cert({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        } catch (error) {
            console.error('[Firebase Admin] Failed to initialize:', error);
            throw new Error('Failed to initialize Firebase Admin');
        }
    }
    return adminApp || getApps()[0];
}

export function getAdminAuth() {
    return getAuth(getAdminApp());
}

export function getAdminFirestore() {
    return getFirestore(getAdminApp());
}

/**
 * Verify Firebase ID token from Authorization header
 * Returns the decoded token if valid, null otherwise
 */
export async function verifyAuthToken(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await getAdminAuth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('[Auth] Token verification failed:', error);
        return null;
    }
}

/**
 * Get user data from Firestore by UID
 */
export async function getUserByUid(uid: string): Promise<User | null> {
    try {
        const userDoc = await getAdminFirestore()
            .collection('users')
            .doc(uid)
            .get();

        if (!userDoc.exists) {
            return null;
        }

        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
        console.error('[Firestore] Error getting user:', error);
        return null;
    }
}
