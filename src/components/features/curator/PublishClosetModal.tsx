'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { publishCloset } from '@/lib/firestore';
import { Closet } from '@/types';
import styles from './PublishClosetModal.module.css';

interface PublishClosetModalProps {
    onClose: () => void;
    onSuccess: (slug: string) => void;
    currentCloset: Closet | null;
}

export const PublishClosetModal: React.FC<PublishClosetModalProps> = ({
    onClose,
    onSuccess,
    currentCloset,
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        displayName: currentCloset?.displayName || user?.displayName || '',
        bio: currentCloset?.bio || '',
        mobileNumber: currentCloset?.mobileNumber || '',
        upiId: currentCloset?.upiId || '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = 'Mobile number is required';
        } else if (!/^\+?[\d\s-]{10,}$/.test(formData.mobileNumber)) {
            newErrors.mobileNumber = 'Please enter a valid mobile number';
        }

        if (!formData.upiId.trim()) {
            newErrors.upiId = 'UPI ID is required';
        } else if (!formData.upiId.includes('@')) {
            newErrors.upiId = 'Please enter a valid UPI ID (e.g., name@upi)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !user) return;

        setLoading(true);
        try {
            const slug = await publishCloset(user.id, {
                mobileNumber: formData.mobileNumber,
                upiId: formData.upiId,
                bio: formData.bio,
                displayName: formData.displayName,
            });

            alert('Closet published successfully! 🎉');
            onSuccess(slug);
        } catch (error) {
            console.error('[PublishModal] Error:', error);
            alert('Failed to publish closet. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Publish Your Closet</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <p className={styles.description}>
                    To publish your closet and start earning, we need some details to contact you and
                    process payments.
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="displayName">Display Name</label>
                        <input
                            id="displayName"
                            name="displayName"
                            type="text"
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="Your name or brand"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="bio">Bio (Optional)</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell renters about your style..."
                            className={styles.textarea}
                            rows={3}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="mobileNumber">
                            Mobile Number <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="mobileNumber"
                            name="mobileNumber"
                            type="tel"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className={`${styles.input} ${errors.mobileNumber ? styles.inputError : ''}`}
                        />
                        {errors.mobileNumber && (
                            <span className={styles.error}>{errors.mobileNumber}</span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="upiId">
                            UPI ID <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="upiId"
                            name="upiId"
                            type="text"
                            value={formData.upiId}
                            onChange={handleChange}
                            placeholder="yourname@paytm"
                            className={`${styles.input} ${errors.upiId ? styles.inputError : ''}`}
                        />
                        {errors.upiId && <span className={styles.error}>{errors.upiId}</span>}
                        <span className={styles.hint}>
                            We'll transfer your earnings to this UPI ID
                        </span>
                    </div>

                    <div className={styles.actions}>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Publishing...' : 'Publish Closet'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
