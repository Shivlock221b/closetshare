import React, { useState, useRef } from 'react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
    images: File[];
    onImagesChange: (images: File[]) => void;
    maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    images,
    onImagesChange,
    maxImages = 5,
}) => {
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remainingSlots = maxImages - images.length;
        const filesToAdd = files.slice(0, remainingSlots);

        if (filesToAdd.length > 0) {
            // Create preview URLs
            const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
            setPreviews([...previews, ...newPreviews]);

            // Update parent component
            onImagesChange([...images, ...filesToAdd]);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        // Revoke preview URL to free memory
        URL.revokeObjectURL(previews[index]);

        // Remove from arrays
        const newPreviews = previews.filter((_, i) => i !== index);
        const newImages = images.filter((_, i) => i !== index);

        setPreviews(newPreviews);
        onImagesChange(newImages);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                {/* Preview existing images */}
                {previews.map((preview, index) => (
                    <div key={index} className={styles.imageCard}>
                        <img src={preview} alt={`Preview ${index + 1}`} className={styles.image} />
                        <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className={styles.removeButton}
                            aria-label="Remove image"
                        >
                            ×
                        </button>
                        {index === 0 && <div className={styles.primaryBadge}>Primary</div>}
                    </div>
                ))}

                {/* Add button */}
                {images.length < maxImages && (
                    <button
                        type="button"
                        onClick={handleClick}
                        className={styles.addButton}
                    >
                        <svg
                            className={styles.addIcon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span>Add Image</span>
                        <span className={styles.count}>
                            {images.length}/{maxImages}
                        </span>
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className={styles.hiddenInput}
            />

            <p className={styles.hint}>
                First image will be the primary image. Max {maxImages} images.
            </p>
        </div>
    );
};
