'use client';

import React, { useState } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadMultipleImages } from '@/lib/storage';
import styles from './IssueReportForm.module.css';

interface IssueReportFormProps {
    rentalId: string;
    reporterType: 'user' | 'curator';
    onSubmit: (data: IssueReportData) => Promise<void>;
    onCancel: () => void;
}

export interface IssueReportData {
    category: string;
    description: string;
    imageUrls: string[];
}

const ISSUE_CATEGORIES = {
    user: [
        { value: 'damaged', label: 'Item arrived damaged' },
        { value: 'wrong_item', label: 'Wrong item received' },
        { value: 'sizing', label: 'Item does not fit as described' },
        { value: 'quality', label: 'Item quality not as shown' },
        { value: 'late_delivery', label: 'Delivery was very late' },
        { value: 'other', label: 'Other issue' },
    ],
    curator: [
        { value: 'damaged', label: 'Item returned damaged' },
        { value: 'missing_item', label: 'Item not returned' },
        { value: 'stains', label: 'Item has stains/odor' },
        { value: 'late_return', label: 'Return was very late' },
        { value: 'other', label: 'Other issue' },
    ],
};

export const IssueReportForm: React.FC<IssueReportFormProps> = ({
    rentalId,
    reporterType,
    onSubmit,
    onCancel,
}) => {
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files).slice(0, 5 - images.length);
        setImages([...images, ...newFiles]);

        // Create preview URLs
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageRemove = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
        setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!category) {
            alert('Please select an issue category');
            return;
        }

        if (!description.trim()) {
            alert('Please describe the issue');
            return;
        }

        setLoading(true);

        try {
            // Upload images if any
            let imageUrls: string[] = [];
            if (images.length > 0) {
                imageUrls = await uploadMultipleImages(
                    images,
                    `issue-reports/${rentalId}/${Date.now()}`
                );
            }

            await onSubmit({
                category,
                description: description.trim(),
                imageUrls,
            });
        } catch (error) {
            console.error('Error submitting issue report:', error);
            alert('Failed to submit issue report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const categories = ISSUE_CATEGORIES[reporterType];

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <AlertTriangle className={styles.warningIcon} size={24} />
                    <h2>Report an Issue</h2>
                    <button className={styles.closeBtn} onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>What's the issue? *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={styles.select}
                            required
                        >
                            <option value="">Select issue type...</option>
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>Describe the issue *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please provide details about the issue. Include any relevant information that would help us investigate."
                            rows={4}
                            className={styles.textarea}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Photos (optional)</label>
                        <p className={styles.hint}>Add photos to help us understand the issue better</p>

                        <div className={styles.imageGrid}>
                            {imagePreviewUrls.map((url, index) => (
                                <div key={index} className={styles.imagePreview}>
                                    <img src={url} alt={`Issue photo ${index + 1}`} />
                                    <button
                                        type="button"
                                        className={styles.removeImageBtn}
                                        onClick={() => handleImageRemove(index)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {images.length < 5 && (
                                <label className={styles.addImageBtn}>
                                    <Camera size={24} />
                                    <span>Add Photo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageAdd}
                                        hidden
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </div>
                </form>

                <p className={styles.disclaimer}>
                    After submitting, our team will review the issue and contact you within 24 hours.
                </p>
            </div>
        </div>
    );
};
