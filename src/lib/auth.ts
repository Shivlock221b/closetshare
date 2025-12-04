import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google OAuth using popup
 */
export const signInWithGoogle = async (): Promise<User> => {
    try {
        console.log('[Auth] Opening Google sign-in popup...');
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        console.log('[Auth] Sign-in successful:', firebaseUser.email);

        // Create user object from Firebase Auth data
        const newUser: User = {
            id: firebaseUser.uid,
            role: 'user',
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || undefined,
            stats: {
                outfitsCount: 0,
                rentalsCount: 0,
                rating: 0,
            },
        };

        // Try to check/create user in Firestore, but don't fail if offline
        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create new user document
                console.log('[Auth] Creating new user in Firestore');
                await setDoc(userRef, newUser);
                console.log('[Auth] New user created');
            } else {
                console.log('[Auth] User exists in Firestore');
                // Return existing user data from Firestore
                return userSnap.data() as User;
            }
        } catch (firestoreError) {
            console.warn('[Auth] Firestore error (continuing with auth data):', firestoreError);
            // Continue with user data from Firebase Auth even if Firestore fails
        }

        return newUser;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Get current user from Firestore
 */
export const getCurrentUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as User;
        }

        // User doesn't exist in Firestore, create from Firebase Auth data
        console.log('[Auth] User not in Firestore, creating from auth data');
        const newUser: User = {
            id: firebaseUser.uid,
            role: 'user',
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || undefined,
            stats: {
                outfitsCount: 0,
                rentalsCount: 0,
                rating: 0,
            },
        };

        try {
            await setDoc(userRef, newUser);
        } catch (setError) {
            console.warn('[Auth] Could not save user to Firestore:', setError);
        }

        return newUser;
    } catch (error) {
        console.error('Error getting current user:', error);

        // If Firestore is offline, create user from Firebase Auth data
        console.log('[Auth] Firestore offline, using Firebase Auth data');
        return {
            id: firebaseUser.uid,
            role: 'user',
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || undefined,
            stats: {
                outfitsCount: 0,
                rentalsCount: 0,
                rating: 0,
            },
        };
    }
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthChanges = (
    callback: (user: User | null) => void
) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('[Auth] Auth state changed, firebaseUser:', firebaseUser?.email || 'null');
        if (firebaseUser) {
            const user = await getCurrentUser(firebaseUser);
            console.log('[Auth] Got user from Firestore:', user?.email || 'null');
            callback(user);
        } else {
            console.log('[Auth] No firebase user, calling callback with null');
            callback(null);
        }
    });
};
