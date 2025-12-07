'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw } from 'lucide-react';
import { Button } from './Button';
import styles from './CircularImageCropperModal.module.css';

interface CircularImageCropperModalProps {
    image: string;
    onCropComplete: (croppedImage: File) => void;
    onCancel: () => void;
}

interface Point {
    x: number;
    y: number;
}

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CroppedAreaPixels extends Area {}

export const CircularImageCropperModal: React.FC<CircularImageCropperModalProps> = ({
    image,
    onCropComplete,
    onCancel,
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const onCropCompleteHandler = useCallback(
        (croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const createCroppedImage = async (): Promise<File> => {
        if (!croppedAreaPixels) {
            throw new Error('No crop area defined');
        }

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                // Set canvas size to square (1:1 aspect ratio)
                const targetSize = 800; // 800x800px for profile images
                canvas.width = targetSize;
                canvas.height = targetSize;

                // Apply rotation if needed
                const rad = (rotation * Math.PI) / 180;
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(rad);

                // Calculate dimensions based on rotation
                let sourceX = croppedAreaPixels.x;
                let sourceY = croppedAreaPixels.y;
                let sourceWidth = croppedAreaPixels.width;
                let sourceHeight = croppedAreaPixels.height;

                if (rotation === 90 || rotation === 270) {
                    ctx.drawImage(
                        img,
                        sourceX,
                        sourceY,
                        sourceWidth,
                        sourceHeight,
                        -canvas.height / 2,
                        -canvas.width / 2,
                        canvas.height,
                        canvas.width
                    );
                } else {
                    ctx.drawImage(
                        img,
                        sourceX,
                        sourceY,
                        sourceWidth,
                        sourceHeight,
                        -canvas.width / 2,
                        -canvas.height / 2,
                        canvas.width,
                        canvas.height
                    );
                }

                // Convert canvas to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }

                        const file = new File([blob], `avatar_${Date.now()}.jpg`, {
                            type: 'image/jpeg',
                        });
                        resolve(file);
                    },
                    'image/jpeg',
                    0.95 // Quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = image;
        });
    };

    const handleSave = async () => {
        setIsCropping(true);
        try {
            const croppedImage = await createCroppedImage();
            onCropComplete(croppedImage);
        } catch (error) {
            console.error('Error cropping image:', error);
            alert('Failed to crop image. Please try again.');
        } finally {
            setIsCropping(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Crop Profile Picture</h2>
                        <p className={styles.subtitle}>Adjust to fit the circle</p>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onCancel}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.cropContainer}>
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteHandler}
                    />
                </div>

                <div className={styles.controls}>
                    <div className={styles.controlRow}>
                        <label className={styles.controlLabel}>Zoom</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>

                    <button
                        className={styles.rotateButton}
                        onClick={onRotate}
                        aria-label="Rotate 90 degrees"
                    >
                        <RotateCw size={20} />
                        Rotate
                    </button>
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onCancel} disabled={isCropping}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isCropping}>
                        {isCropping ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
