import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    ...props
}) => {
    return (
        <button
            className={clsx(
                styles.button,
                styles[variant],
                styles[size],
                { [styles.fullWidth]: fullWidth },
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
