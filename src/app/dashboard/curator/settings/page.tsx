'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getClosetByCurator, updateCuratorProfile } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';
import { Closet } from '@/types';
import styles from './page.module.css';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [closet, setCloset] = useState<Closet | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        mobileNumber: '',
        upiId: '',
        instagram: '',
        pinterest: '',
        website: '',
    });
    const [avatarUrl, setAvatarUrl] = useState<string>('');

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
                    });
                    setAvatarUrl(closetData.avatarUrl || user.avatarUrl || '');
                } else {
                    // No closet yet, use user data
                    setFormData(prev => ({
                        ...prev,
                        displayName: user.displayName || '',
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, `avatars/${user.id}`);
            setAvatarUrl(url);
        } catch (error) {
            console.error('[Settings] Error uploading avatar:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateCuratorProfile(user.id, {
                displayName: formData.displayName,
                bio: formData.bio,
                mobileNumber: formData.mobileNumber,
                upiId: formData.upiId,
                avatarUrl: avatarUrl,
                socialLinks: {
                    instagram: formData.instagram || undefined,
                    pinterest: formData.pinterest || undefined,
                    website: formData.website || undefined,
                },
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
                                onChange={handleAvatarUpload}
                                className={styles.fileInput}
                            />
                            <label htmlFor="avatar" className={styles.uploadBtn}>
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </label>
                        </div>
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
                        />
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Social Links</h2>
                    <div className={styles.formGrid}>
                        <Input
                            id="instagram"
                            label="Instagram"
                            placeholder="https://instagram.com/yourhandle"
                            value={formData.instagram}
                            onChange={handleInputChange}
                        />
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

                <div className={styles.actions}>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </main>
    );
}
