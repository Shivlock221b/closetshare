'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export interface ImpersonationState {
    effectiveUserId: string | null;
    impersonatedUserId: string | null;
    impersonatedUserName: string | null;
    isImpersonating: boolean;
    exitImpersonation: () => void;
}

/**
 * Hook to handle admin impersonation across curator dashboard pages
 * Returns the effective user ID (impersonated user if admin is viewing, otherwise current user)
 */
export function useAdminImpersonation(): ImpersonationState {
    const router = useRouter();
    const { user } = useAuth();
    const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
    const [impersonatedUserName, setImpersonatedUserName] = useState<string | null>(null);

    // Check for admin impersonation on mount
    useEffect(() => {
        const impersonateUserId = localStorage.getItem('admin_impersonate_user_id');
        const impersonateUserName = localStorage.getItem('admin_impersonate_user_name');
        if (impersonateUserId) {
            setImpersonatedUserId(impersonateUserId);
            setImpersonatedUserName(impersonateUserName);
        }
    }, []);

    const exitImpersonation = () => {
        localStorage.removeItem('admin_impersonate_user_id');
        localStorage.removeItem('admin_impersonate_user_name');
        router.push('/dashboard/admin');
    };

    return {
        effectiveUserId: impersonatedUserId || user?.id || null,
        impersonatedUserId,
        impersonatedUserName,
        isImpersonating: !!impersonatedUserId,
        exitImpersonation,
    };
}
