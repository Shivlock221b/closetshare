'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CleaningPricePopup } from '@/components/ui/CleaningPricePopup';
import { uploadMultipleImages, getOutfitImagePath } from '@/lib/storage';
import { createOutfit, updateClosetStats } from '@/lib/firestore';
import { CleaningType } from '@/types';
import styles from './page.module.css';

export default function AddOutfitPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [showPricePopup, setShowPricePopup] = useState(false);
    const [cleaningType, setCleaningType] = useState<CleaningType>('wash_iron');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        size: '',
        perNightPrice: '',
        securityDeposit: '',
        tags: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates: Record<string, string> = { [name]: value };
            // Auto-sync security deposit to per night price
            if (name === 'perNightPrice') {
                updates.securityDeposit = value;
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert('You must be signed in to add an outfit');
            return;
        }

        if (images.length === 0) {
            alert('Please add at least one image');
            return;
        }

        // Validate price
        const price = parseFloat(formData.perNightPrice);
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price greater than 0');
            return;
        }

        if (price > 100000) {
            alert('Price seems unusually high. Please verify.');
            return;
        }

        // Validate security deposit
        const deposit = parseFloat(formData.securityDeposit);
        if (isNaN(deposit) || deposit < 0) {
            alert('Please enter a valid security deposit (0 or greater)');
            return;
        }

        setLoading(true);

        try {
            // Create outfit ID first
            const tempOutfitId = `temp_${Date.now()}`;

            // Upload images to Firebase Storage
            const storagePath = getOutfitImagePath(user.id, tempOutfitId);
            const imageUrls = await uploadMultipleImages(images, storagePath);

            // Create outfit in Firestore
            const outfitId = await createOutfit({
                curatorId: user.id,
                title: formData.title,
                description: formData.description,
                images: imageUrls,
                size: formData.size,
                category: formData.category,
                perNightPrice: parseFloat(formData.perNightPrice),
                securityDeposit: parseFloat(formData.securityDeposit),
                cleaningType: cleaningType,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                availability: {
                    enabled: true,
                    blockedDates: [],
                },
                status: 'active',
                stats: {
                    rentalsCount: 0,
                    rating: 0,
                },
            });

            // Update closet stats
            await updateClosetStats(user.id, { outfitsCount: 1 });

            console.log('[AddOutfit] Outfit created:', outfitId);
            alert('Outfit added successfully!');
            router.push('/dashboard/curator/closet');
        } catch (error) {
            console.error('[AddOutfit] Error:', error);
            alert('Failed to add outfit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.header}>
                    <button onClick={() => router.back()} className={styles.backButton}>
                        ← Back
                    </button>
                    <h1>Add New Outfit</h1>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Images */}
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Images *</label>
                        <ImageUpload
                            images={images}
                            onImagesChange={setImages}
                            maxImages={5}
                        />
                    </div>

                    {/* Basic Info */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionLabel}>Basic Information</h2>
                        <Input
                            label="Title *"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Vintage Floral Maxi Dress"
                            required
                        />

                        <div className={styles.field}>
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe the outfit, occasion, styling tips..."
                                required
                                rows={4}
                                className={styles.textarea}
                                maxLength={500}
                            />
                            <div className={styles.charCount}>
                                {formData.description.length}/500 characters
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    className={styles.select}
                                >
                                    <option value="">Select category</option>
                                    <option value="dress">Dress</option>
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="outerwear">Outerwear</option>
                                    <option value="accessories">Accessories</option>
                                    <option value="shoes">Shoes</option>
                                    <option value="set">Complete Set</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="size">Size *</label>
                                <select
                                    id="size"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleInputChange}
                                    required
                                    className={styles.select}
                                >
                                    <option value="">Select size</option>
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                    <option value="One Size">One Size</option>
                                </select>
                            </div>
                        </div>

                        <Input
                            label="Tags (comma separated)"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="e.g., vintage, floral, summer, boho"
                        />
                    </div>

                    {/* Pricing */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionLabel}>Pricing</h2>
                        <div className={styles.row}>
                            <Input
                                label="Per Night Price (₹) *"
                                name="perNightPrice"
                                type="number"
                                value={formData.perNightPrice}
                                onChange={handleInputChange}
                                placeholder="450"
                                required
                                min="0"
                                step="1"
                            />

                            <div className={styles.depositField}>
                                <label>Security Deposit (₹)</label>
                                <div className={styles.depositValue}>
                                    ₹{formData.perNightPrice || '0'}
                                </div>
                                <p className={styles.depositHint}>Equal to 1 night's rent</p>
                            </div>
                        </div>
                        <div className={styles.commissionBanner}>
                            <span className={styles.commissionIcon}>🎉</span>
                            <div>
                                <strong>Zero Commission!</strong>
                                <span>You keep 100% of your rental earnings</span>
                            </div>
                        </div>
                    </div>

                    {/* Cleaning Options */}
                    <div className={styles.section}>
                        <div className={styles.cleaningHeader}>
                            <h2 className={styles.sectionLabel}>Cleaning Upon Return</h2>
                            <button
                                type="button"
                                className={styles.viewPricesButton}
                                onClick={() => setShowPricePopup(true)}
                            >
                                📋 View Price List
                            </button>
                        </div>

                        <p className={styles.cleaningDescription}>
                            Select how this outfit should be cleaned after each rental to maintain hygiene and condition.
                        </p>

                        <div className={styles.cleaningOptions}>
                            <label className={`${styles.cleaningOption} ${cleaningType === 'wash_iron' ? styles.cleaningOptionSelected : ''}`}>
                                <input
                                    type="radio"
                                    name="cleaningType"
                                    value="wash_iron"
                                    checked={cleaningType === 'wash_iron'}
                                    onChange={() => setCleaningType('wash_iron')}
                                />
                                <div className={styles.cleaningOptionContent}>
                                    <span className={styles.cleaningIcon}>🧺</span>
                                    <div>
                                        <strong>Wash & Steam Iron</strong>
                                        <span>Best for regular fabrics, cotton, linen</span>
                                    </div>
                                </div>
                            </label>

                            <label className={`${styles.cleaningOption} ${cleaningType === 'dry_clean' ? styles.cleaningOptionSelected : ''}`}>
                                <input
                                    type="radio"
                                    name="cleaningType"
                                    value="dry_clean"
                                    checked={cleaningType === 'dry_clean'}
                                    onChange={() => setCleaningType('dry_clean')}
                                />
                                <div className={styles.cleaningOptionContent}>
                                    <span className={styles.cleaningIcon}>✨</span>
                                    <div>
                                        <strong>Dry Clean</strong>
                                        <span>Best for delicate, silk, ethnic, leather</span>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className={styles.cleaningDisclaimer}>
                            <span className={styles.disclaimerIcon}>ℹ️</span>
                            <p>
                                The cleaning cost will be deducted from your nightly rental earnings.
                                This ensures your outfit is professionally cleaned and maintained in
                                excellent condition upon return.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Outfit'}
                        </Button>
                    </div>
                </form>

                {/* Price Popup */}
                {showPricePopup && (
                    <CleaningPricePopup onClose={() => setShowPricePopup(false)} />
                )}
            </div>
        </main>
    );
}
