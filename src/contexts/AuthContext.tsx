'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { signInWithGoogle, signOut, subscribeToAuthChanges } from '@/lib/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[AuthContext] Setting up auth state listener...');

        // Subscribe to auth state changes
        const unsubscribe = subscribeToAuthChanges((user) => {
            console.log('[AuthContext] Auth state callback, user:', user?.email || 'null');
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignIn = async () => {
        try {
            console.log('[AuthContext] Starting sign-in...');
            const user = await signInWithGoogle();
            console.log('[AuthContext] Sign-in complete, user:', user.email);
            setUser(user);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signOut: handleSignOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
