import React from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className,
    id,
    ...props
}) => {
    return (
        <div className={styles.wrapper}>
            {label && <label htmlFor={id} className={styles.label}>{label}</label>}
            <input
                id={id}
                className={clsx(styles.input, { [styles.hasError]: error }, className)}
                {...props}
            />
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
};
