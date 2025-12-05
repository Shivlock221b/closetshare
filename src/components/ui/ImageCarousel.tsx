'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import styles from './ImageCarousel.module.css';

interface ImageCarouselProps {
    images: string[];
    alt?: string;
    enableFullscreen?: boolean;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
    images,
    alt = 'Image',
    enableFullscreen = false
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Required min distance traveled for swipe
    const minSwipeDistance = 50;

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToIndex = (index: number) => {
        setCurrentIndex(index);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextImage();
        } else if (isRightSwipe) {
            prevImage();
        }
    };

    if (!images || images.length === 0) {
        return (
            <div className={styles.placeholder}>
                <span>👗</span>
            </div>
        );
    }

    return (
        <>
            <div className={styles.carousel}>
                <div
                    className={styles.imageContainer}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <img
                        src={images[currentIndex]}
                        alt={`${alt} - Image ${currentIndex + 1}`}
                        className={styles.image}
                        onClick={() => enableFullscreen && setIsFullscreen(true)}
                        style={{ cursor: enableFullscreen ? 'pointer' : 'default' }}
                    />

                    {images.length > 1 && (
                        <>
                            <button
                                className={`${styles.navButton} ${styles.prevButton}`}
                                onClick={prevImage}
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                className={`${styles.navButton} ${styles.nextButton}`}
                                onClick={nextImage}
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {enableFullscreen && (
                        <button
                            className={styles.fullscreenButton}
                            onClick={() => setIsFullscreen(true)}
                            aria-label="View fullscreen"
                        >
                            <Maximize2 size={20} />
                        </button>
                    )}
                </div>

                {images.length > 1 && (
                    <div className={styles.indicators}>
                        {images.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
                                onClick={() => goToIndex(index)}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {images.length > 1 && (
                    <div className={styles.thumbnails}>
                        {images.map((img, index) => (
                            <button
                                key={index}
                                className={`${styles.thumbnail} ${index === currentIndex ? styles.activeThumbnail : ''}`}
                                onClick={() => goToIndex(index)}
                            >
                                <img src={img} alt={`Thumbnail ${index + 1}`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div className={styles.fullscreenOverlay} onClick={() => setIsFullscreen(false)}>
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsFullscreen(false)}
                        aria-label="Close fullscreen"
                    >
                        <X size={32} />
                    </button>

                    <div className={styles.fullscreenContent} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={images[currentIndex]}
                            alt={`${alt} - Image ${currentIndex + 1}`}
                            className={styles.fullscreenImage}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    className={`${styles.navButton} ${styles.prevButton}`}
                                    onClick={prevImage}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    className={`${styles.navButton} ${styles.nextButton}`}
                                    onClick={nextImage}
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={32} />
                                </button>

                                <div className={styles.fullscreenIndicators}>
                                    {images.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
                                            onClick={() => goToIndex(index)}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
