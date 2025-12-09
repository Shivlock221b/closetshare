import React from 'react';
import { Button } from './Button';

interface AdminBannerProps {
    impersonatedUserName: string;
    onExit: () => void;
}

export function AdminBanner({ impersonatedUserName, onExit }: AdminBannerProps) {
    return (
        <div style={{
            background: '#f59e0b',
            color: 'white',
            padding: '12px 24px',
            textAlign: 'center',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px'
        }}>
            <span>👁️ Admin View: Viewing as {impersonatedUserName}</span>
            <Button
                size="sm"
                variant="secondary"
                onClick={onExit}
            >
                Exit Admin View
            </Button>
        </div>
    );
}
