'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { publishCloset } from '@/lib/firestore';
import { Closet, BodyType } from '@/types';
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
        // Pickup Address
        pickupFullName: currentCloset?.pickupAddress?.fullName || user?.displayName || '',
        pickupPhone: currentCloset?.pickupAddress?.phone || currentCloset?.mobileNumber || '',
        pickupAddress: currentCloset?.pickupAddress?.addressLine1 || '',
        pickupCity: currentCloset?.pickupAddress?.city || '',
        pickupState: currentCloset?.pickupAddress?.state || '',
        pickupZip: currentCloset?.pickupAddress?.zipCode || '',
        // Size Profile
        height: currentCloset?.sizeProfile?.height || '',
        bodyType: (currentCloset?.sizeProfile?.bodyType || '') as BodyType,
        shoeSize: currentCloset?.sizeProfile?.shoeSize || '',
        bustChest: currentCloset?.sizeProfile?.bustChest || '',
        waist: currentCloset?.sizeProfile?.waist || '',
        hips: currentCloset?.sizeProfile?.hips || '',
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

        // Validate pickup address
        if (!formData.pickupFullName.trim()) {
            newErrors.pickupFullName = 'Full name is required';
        }

        if (!formData.pickupPhone.trim()) {
            newErrors.pickupPhone = 'Phone number is required';
        } else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.pickupPhone)) {
            newErrors.pickupPhone = 'Please enter a valid phone number';
        }

        if (!formData.pickupAddress.trim()) {
            newErrors.pickupAddress = 'Address is required';
        }

        if (!formData.pickupCity.trim()) {
            newErrors.pickupCity = 'City is required';
        }

        if (!formData.pickupState.trim()) {
            newErrors.pickupState = 'State is required';
        }

        if (!formData.pickupZip.trim()) {
            newErrors.pickupZip = 'PIN code is required';
        } else if (!/^[1-9][0-9]{5}$/.test(formData.pickupZip)) {
            newErrors.pickupZip = 'Please enter a valid 6-digit PIN code';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !user) return;

        setLoading(true);
        try {
            // Only include sizeProfile if at least one field is filled
            const hasSizeProfile = formData.height || formData.bodyType || formData.shoeSize ||
                                   formData.bustChest || formData.waist || formData.hips;

            const slug = await publishCloset(user.id, {
                mobileNumber: formData.mobileNumber,
                upiId: formData.upiId,
                bio: formData.bio,
                displayName: formData.displayName,
                pickupAddress: {
                    fullName: formData.pickupFullName,
                    phone: formData.pickupPhone,
                    addressLine1: formData.pickupAddress,
                    city: formData.pickupCity,
                    state: formData.pickupState,
                    zipCode: formData.pickupZip,
                },
                ...(hasSizeProfile && {
                    sizeProfile: {
                        ...(formData.height && { height: formData.height }),
                        ...(formData.bodyType && { bodyType: formData.bodyType }),
                        ...(formData.shoeSize && { shoeSize: formData.shoeSize }),
                        ...(formData.bustChest && { bustChest: formData.bustChest }),
                        ...(formData.waist && { waist: formData.waist }),
                        ...(formData.hips && { hips: formData.hips }),
                    }
                }),
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

                    <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '1.1rem' }}>Pickup Address</h3>
                    <p className={styles.hint} style={{ marginTop: '-8px', marginBottom: '12px' }}>
                        Where should renters return the outfits?
                    </p>

                    <div className={styles.field}>
                        <label htmlFor="pickupFullName">
                            Full Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="pickupFullName"
                            name="pickupFullName"
                            type="text"
                            value={formData.pickupFullName}
                            onChange={handleChange}
                            placeholder="Jane Doe"
                            className={`${styles.input} ${errors.pickupFullName ? styles.inputError : ''}`}
                        />
                        {errors.pickupFullName && (
                            <span className={styles.error}>{errors.pickupFullName}</span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="pickupPhone">
                            Phone Number <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="pickupPhone"
                            name="pickupPhone"
                            type="tel"
                            value={formData.pickupPhone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className={`${styles.input} ${errors.pickupPhone ? styles.inputError : ''}`}
                        />
                        {errors.pickupPhone && (
                            <span className={styles.error}>{errors.pickupPhone}</span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="pickupAddress">
                            Address <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="pickupAddress"
                            name="pickupAddress"
                            type="text"
                            value={formData.pickupAddress}
                            onChange={handleChange}
                            placeholder="123 Fashion St"
                            className={`${styles.input} ${errors.pickupAddress ? styles.inputError : ''}`}
                        />
                        {errors.pickupAddress && (
                            <span className={styles.error}>{errors.pickupAddress}</span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="pickupState">
                            State <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="pickupState"
                            name="pickupState"
                            type="text"
                            value={formData.pickupState}
                            onChange={handleChange}
                            placeholder="Maharashtra"
                            className={`${styles.input} ${errors.pickupState ? styles.inputError : ''}`}
                        />
                        {errors.pickupState && (
                            <span className={styles.error}>{errors.pickupState}</span>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.field}>
                            <label htmlFor="pickupCity">
                                City <span className={styles.required}>*</span>
                            </label>
                            <input
                                id="pickupCity"
                                name="pickupCity"
                                type="text"
                                value={formData.pickupCity}
                                onChange={handleChange}
                                placeholder="Mumbai"
                                className={`${styles.input} ${errors.pickupCity ? styles.inputError : ''}`}
                            />
                            {errors.pickupCity && (
                                <span className={styles.error}>{errors.pickupCity}</span>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="pickupZip">
                                PIN Code <span className={styles.required}>*</span>
                            </label>
                            <input
                                id="pickupZip"
                                name="pickupZip"
                                type="text"
                                value={formData.pickupZip}
                                onChange={handleChange}
                                placeholder="400001"
                                className={`${styles.input} ${errors.pickupZip ? styles.inputError : ''}`}
                            />
                            {errors.pickupZip && (
                                <span className={styles.error}>{errors.pickupZip}</span>
                            )}
                        </div>
                    </div>

                    <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '1.1rem' }}>Size Profile (Optional)</h3>
                    <p className={styles.hint} style={{ marginTop: '-8px', marginBottom: '12px' }}>
                        Help renters understand what size to expect. All fields are optional.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.field}>
                            <label htmlFor="height">Height</label>
                            <input
                                id="height"
                                name="height"
                                type="text"
                                value={formData.height}
                                onChange={handleChange}
                                placeholder="5'7&quot; or 170cm"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="bodyType">Body Type</label>
                            <select
                                id="bodyType"
                                name="bodyType"
                                value={formData.bodyType}
                                onChange={handleChange}
                                className={styles.input}
                            >
                                <option value="">Select...</option>
                                <option value="petite">Petite</option>
                                <option value="slim">Slim</option>
                                <option value="athletic">Athletic</option>
                                <option value="curvy">Curvy</option>
                                <option value="plus-size">Plus Size</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="shoeSize">Shoe Size</label>
                        <input
                            id="shoeSize"
                            name="shoeSize"
                            type="text"
                            value={formData.shoeSize}
                            onChange={handleChange}
                            placeholder="7 or 39"
                            className={styles.input}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className={styles.field}>
                            <label htmlFor="bustChest">Bust/Chest</label>
                            <input
                                id="bustChest"
                                name="bustChest"
                                type="text"
                                value={formData.bustChest}
                                onChange={handleChange}
                                placeholder="34&quot; or 86cm"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="waist">Waist</label>
                            <input
                                id="waist"
                                name="waist"
                                type="text"
                                value={formData.waist}
                                onChange={handleChange}
                                placeholder="28&quot; or 71cm"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="hips">Hips</label>
                            <input
                                id="hips"
                                name="hips"
                                type="text"
                                value={formData.hips}
                                onChange={handleChange}
                                placeholder="36&quot; or 91cm"
                                className={styles.input}
                            />
                        </div>
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
