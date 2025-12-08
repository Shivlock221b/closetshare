'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CircularImageCropperModal } from '@/components/ui/CircularImageCropperModal';
import { getClosetByCurator, updateCuratorProfile } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';
import { Closet, BodyType } from '@/types';
import styles from './page.module.css';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [closet, setCloset] = useState<Closet | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        mobileNumber: '',
        upiId: '',
        instagram: '',
        pinterest: '',
        website: '',
        slug: '',
        // Pickup Address
        pickupFullName: '',
        pickupPhone: '',
        pickupAddress: '',
        pickupCity: '',
        pickupState: '',
        pickupZip: '',
        // Size Profile
        height: '',
        bodyType: 'slim' as BodyType,
        shoeSize: '',
        bustChest: '',
        waist: '',
        hips: '',
    });
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [slugError, setSlugError] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const closetData = await getClosetByCurator(user.id);
                if (closetData) {
                    setCloset(closetData);
                    setFormData({
                        displayName: closetData.displayName || user.displayName || '',
                        bio: closetData.bio || '',
                        mobileNumber: closetData.mobileNumber || '',
                        upiId: closetData.upiId || '',
                        instagram: closetData.socialLinks?.instagram || '',
                        pinterest: closetData.socialLinks?.pinterest || '',
                        website: closetData.socialLinks?.website || '',
                        slug: closetData.slug || '',
                        // Pickup Address
                        pickupFullName: closetData.pickupAddress?.fullName || user.displayName || '',
                        pickupPhone: closetData.pickupAddress?.phone || closetData.mobileNumber || '',
                        pickupAddress: closetData.pickupAddress?.addressLine1 || '',
                        pickupCity: closetData.pickupAddress?.city || '',
                        pickupState: closetData.pickupAddress?.state || '',
                        pickupZip: closetData.pickupAddress?.zipCode || '',
                        // Size Profile
                        height: closetData.sizeProfile?.height || '',
                        bodyType: (closetData.sizeProfile?.bodyType || 'slim') as BodyType,
                        shoeSize: closetData.sizeProfile?.shoeSize || '',
                        bustChest: closetData.sizeProfile?.bustChest || '',
                        waist: closetData.sizeProfile?.waist || '',
                        hips: closetData.sizeProfile?.hips || '',
                    });
                    setAvatarUrl(closetData.avatarUrl || user.avatarUrl || '');
                } else {
                    // No closet yet, use user data
                    setFormData(prev => ({
                        ...prev,
                        displayName: user.displayName || '',
                        slug: '',
                    }));
                    setAvatarUrl(user.avatarUrl || '');
                }
            } catch (error) {
                console.error('[Settings] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [id]: value };

            // If changing instagram, normalize to username only
            if (id === 'instagram') {
                // Extract username from URL or remove @ symbol
                const handle = value.replace(/.*instagram\.com\//, '').replace(/\/.*/, '').replace('@', '').trim();
                updates.instagram = handle;

                // If slug is empty, suggest instagram username as slug
                if (!prev.slug && handle) {
                    updates.slug = handle.toLowerCase();
                }
            }
            return updates;
        });
        if (id === 'slug') {
            setSlugError('');
        }
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview URL and open cropper
        const imageUrl = URL.createObjectURL(file);
        setImageToCrop(imageUrl);
    };

    const handleCropComplete = async (croppedImage: File) => {
        if (!user) return;

        setUploading(true);
        setImageToCrop(null);

        try {
            const url = await uploadImage(croppedImage, `avatars/${user.id}`);
            setAvatarUrl(url);
        } catch (error) {
            console.error('[Settings] Error uploading avatar:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleCropCancel = () => {
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
    };

    const handleSave = async () => {
        if (!user) return;

        // Validate mobile number format (10-15 digits, may include +, spaces, hyphens, parentheses)
        if (formData.mobileNumber) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
            if (!phoneRegex.test(formData.mobileNumber)) {
                alert('Please enter a valid mobile number (10-15 digits)');
                return;
            }
        }

        // Validate slug format
        const slugRegex = /^[a-z0-9-_]+$/;
        if (formData.slug && !slugRegex.test(formData.slug)) {
            setSlugError('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
            return;
        }

        setSaving(true);
        try {
            await updateCuratorProfile(user.id, {
                displayName: formData.displayName,
                bio: formData.bio,
                mobileNumber: formData.mobileNumber,
                upiId: formData.upiId,
                avatarUrl: avatarUrl,
                slug: formData.slug || undefined,
                socialLinks: {
                    instagram: formData.instagram || undefined,
                    pinterest: formData.pinterest || undefined,
                    website: formData.website || undefined,
                },
                pickupAddress: formData.pickupAddress ? {
                    fullName: formData.pickupFullName,
                    phone: formData.pickupPhone,
                    addressLine1: formData.pickupAddress,
                    city: formData.pickupCity,
                    state: formData.pickupState,
                    zipCode: formData.pickupZip,
                } : undefined,
                sizeProfile: formData.height ? {
                    height: formData.height,
                    bodyType: formData.bodyType,
                    shoeSize: formData.shoeSize,
                    bustChest: formData.bustChest,
                    waist: formData.waist,
                    hips: formData.hips,
                } : undefined,
            });
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('[Settings] Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <p>Loading...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        router.push('/');
        return null;
    }

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.header}>
                    <button onClick={() => router.back()} className={styles.backButton}>
                        ← Back
                    </button>
                    <h1>Profile Settings</h1>
                </div>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Profile Picture</h2>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarPreview}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {formData.displayName?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        <div className={styles.avatarUpload}>
                            <input
                                type="file"
                                id="avatar"
                                accept="image/*"
                                onChange={handleAvatarSelect}
                                className={styles.fileInput}
                            />
                            <label htmlFor="avatar" className={styles.uploadBtn}>
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </label>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Your Closet URL</h2>
                    <div className={styles.slugSection}>
                        <div className={styles.slugInput}>
                            <span className={styles.slugPrefix}>closetshare.in/c/</span>
                            <Input
                                id="slug"
                                placeholder="your-username"
                                value={formData.slug}
                                onChange={handleInputChange}
                            />
                        </div>
                        {slugError && <p className={styles.error}>{slugError}</p>}
                        <p className={styles.hint}>
                            This is your unique closet URL. Use lowercase letters, numbers, and hyphens only.
                            {formData.instagram && !formData.slug && (
                                <span className={styles.suggestion}>
                                    Tip: Your Instagram handle will be used as default.
                                </span>
                            )}
                        </p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Basic Information</h2>
                    <div className={styles.formGrid}>
                        <Input
                            id="displayName"
                            label="Display Name"
                            placeholder="Your name"
                            value={formData.displayName}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="mobileNumber"
                            label="Phone Number"
                            placeholder="+91 98765 43210"
                            value={formData.mobileNumber}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={styles.textareaWrapper}>
                        <label htmlFor="bio" className={styles.label}>Bio</label>
                        <textarea
                            id="bio"
                            placeholder="Tell people about yourself and your style..."
                            value={formData.bio}
                            onChange={handleInputChange}
                            className={styles.textarea}
                            rows={3}
                            maxLength={100}
                        />
                        <div className={styles.charCount}>
                            {formData.bio.length}/100 characters
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Social Links</h2>
                    <div className={styles.formGrid}>
                        <div>
                            <Input
                                id="instagram"
                                label="Instagram Username"
                                placeholder="yourhandle"
                                value={formData.instagram}
                                onChange={handleInputChange}
                            />
                            <p className={styles.hint}>
                                Enter just your username (e.g., fashionista) or paste your Instagram URL
                            </p>
                        </div>
                        <Input
                            id="pinterest"
                            label="Pinterest"
                            placeholder="https://pinterest.com/yourhandle"
                            value={formData.pinterest}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="website"
                            label="Website"
                            placeholder="https://yourwebsite.com"
                            value={formData.website}
                            onChange={handleInputChange}
                        />
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Payment Details</h2>
                    <div className={styles.formGrid}>
                        <Input
                            id="upiId"
                            label="UPI ID"
                            placeholder="yourname@upi"
                            value={formData.upiId}
                            onChange={handleInputChange}
                        />
                    </div>
                    <p className={styles.hint}>
                        Your earnings will be sent to this UPI ID after rentals are completed.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Pickup Address</h2>
                    <p className={styles.hint} style={{ marginTop: '-8px', marginBottom: '12px' }}>
                        Where should renters return the outfits?
                    </p>
                    <div className={styles.formGrid}>
                        <Input
                            id="pickupFullName"
                            label="Full Name"
                            placeholder="Jane Doe"
                            value={formData.pickupFullName}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="pickupPhone"
                            label="Phone Number"
                            placeholder="+91 98765 43210"
                            value={formData.pickupPhone}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="pickupAddress"
                            label="Address"
                            placeholder="123 Fashion St"
                            value={formData.pickupAddress}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="pickupState"
                            label="State"
                            placeholder="Maharashtra"
                            value={formData.pickupState}
                            onChange={handleInputChange}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Input
                                id="pickupCity"
                                label="City"
                                placeholder="Mumbai"
                                value={formData.pickupCity}
                                onChange={handleInputChange}
                            />
                            <Input
                                id="pickupZip"
                                label="PIN Code"
                                placeholder="400001"
                                value={formData.pickupZip}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Size Profile</h2>
                    <p className={styles.hint} style={{ marginTop: '-8px', marginBottom: '12px' }}>
                        Help renters understand what size to expect
                    </p>
                    <div className={styles.formGrid}>
                        <Input
                            id="height"
                            label="Height"
                            placeholder="5'7&quot; or 170cm"
                            value={formData.height}
                            onChange={handleInputChange}
                        />
                        <div>
                            <label htmlFor="bodyType" className={styles.label}>Body Type</label>
                            <select
                                id="bodyType"
                                value={formData.bodyType}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                }}
                            >
                                <option value="petite">Petite</option>
                                <option value="slim">Slim</option>
                                <option value="athletic">Athletic</option>
                                <option value="curvy">Curvy</option>
                                <option value="plus-size">Plus Size</option>
                            </select>
                        </div>
                        <Input
                            id="shoeSize"
                            label="Shoe Size"
                            placeholder="7 or 39"
                            value={formData.shoeSize}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="bustChest"
                            label="Bust/Chest"
                            placeholder="34&quot; or 86cm"
                            value={formData.bustChest}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="waist"
                            label="Waist"
                            placeholder="28&quot; or 71cm"
                            value={formData.waist}
                            onChange={handleInputChange}
                        />
                        <Input
                            id="hips"
                            label="Hips"
                            placeholder="36&quot; or 91cm"
                            value={formData.hips}
                            onChange={handleInputChange}
                        />
                    </div>
                </section>

                <div className={styles.actions}>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Circular Image Cropper Modal */}
            {imageToCrop && (
                <CircularImageCropperModal
                    image={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </main>
    );
}
