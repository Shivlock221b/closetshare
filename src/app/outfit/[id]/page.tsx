'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Check, ShoppingBag } from 'lucide-react';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/ErrorState';
import { getOutfitById, getClosetByCurator, getBlockedDates } from '@/lib/firestore';
import { useCart } from '@/contexts/CartContext';
import { Outfit, Closet } from '@/types';

export default function OutfitPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { addToCart, isInCart } = useCart();

    const [outfit, setOutfit] = useState<Outfit | null>(null);
    const [closet, setCloset] = useState<Closet | null>(null);
    const [blockedDates, setBlockedDates] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected dates state
    const [selectedDates, setSelectedDates] = useState<{
        startDate: Date;
        endDate: Date;
        nights: number;
    } | null>(null);

    const inCart = isInCart(id);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const outfitData = await getOutfitById(id);
                if (!outfitData) {
                    setError('Outfit not found');
                    setLoading(false);
                    return;
                }

                setOutfit(outfitData);
                const closetData = await getClosetByCurator(outfitData.curatorId);
                setCloset(closetData);

                // Fetch blocked dates
                const blocked = await getBlockedDates(id);
                setBlockedDates(blocked);
            } catch (err) {
                console.error('[OutfitPage] Error fetching data:', err);
                setError('Failed to load outfit data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleDateSelect = (startDate: Date, endDate: Date, nights: number) => {
        setSelectedDates({ startDate, endDate, nights });
    };

    const handleDateClear = () => {
        setSelectedDates(null);
    };

    const handleAddToCart = () => {
        addToCart(id);
    };

    const handleRentNow = () => {
        if (!selectedDates) {
            alert('Please select your rental dates first');
            return;
        }
        // Navigate to checkout with dates as query params
        const params = new URLSearchParams({
            start: selectedDates.startDate.getTime().toString(),
            end: selectedDates.endDate.getTime().toString(),
            nights: selectedDates.nights.toString(),
        });
        router.push(`/checkout/${id}?${params.toString()}`);
    };

    if (loading) {
        return (
            <main className={styles.container}>
                <Header />
                <div className={styles.loadingState}>
                    <LoadingSpinner size="lg" text="Loading outfit..." />
                </div>
            </main>
        );
    }

    if (error || !outfit) {
        const errorTitle = error === 'Outfit not found' ? 'Outfit Not Found' : 'Error Loading Outfit';
        const errorMessage = error || "The outfit you're looking for doesn't exist or couldn't be loaded.";

        return (
            <main className={styles.container}>
                <Header />
                <ErrorState
                    title={errorTitle}
                    message={errorMessage}
                    onRetry={() => window.location.reload()}
                />
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <Header />

            <div className={styles.hero}>
                <ImageCarousel images={outfit.images} alt={outfit.title} />
            </div>

            <div className={styles.details}>
                {closet && (
                    <>
                        <Link href={`/c/${closet.slug}`} className={styles.curatorRow}>
                            <Avatar
                                src={closet.avatarUrl}
                                name={closet.displayName || 'Unknown Curator'}
                                size="md"
                            />
                            <div>
                                <div className={styles.curatorName}>{closet.displayName || 'Unknown Curator'}</div>
                                <div className={styles.curatorLabel}>curator</div>
                            </div>
                        </Link>

                        {closet.sizeProfile && (
                            <div className={styles.sizeProfile}>
                                <h3 className={styles.sizeProfileTitle}>Curator's Size Profile</h3>
                                <div className={styles.sizeProfileGrid}>
                                    <div className={styles.sizeProfileItem}>
                                        <span className={styles.sizeProfileLabel}>Height:</span>
                                        <span className={styles.sizeProfileValue}>{closet.sizeProfile.height}</span>
                                    </div>
                                    <div className={styles.sizeProfileItem}>
                                        <span className={styles.sizeProfileLabel}>Body Type:</span>
                                        <span className={styles.sizeProfileValue}>{closet.sizeProfile.bodyType.charAt(0).toUpperCase() + closet.sizeProfile.bodyType.slice(1)}</span>
                                    </div>
                                    <div className={styles.sizeProfileItem}>
                                        <span className={styles.sizeProfileLabel}>Shoe Size:</span>
                                        <span className={styles.sizeProfileValue}>{closet.sizeProfile.shoeSize}</span>
                                    </div>
                                    <div className={styles.sizeProfileItem}>
                                        <span className={styles.sizeProfileLabel}>Bust/Chest:</span>
                                        <span className={styles.sizeProfileValue}>{closet.sizeProfile.bustChest}</span>
                                    </div>
                                    <div className={styles.sizeProfileItem}>
                                        <span className={styles.sizeProfileLabel}>Waist:</span>
                                        <span className={styles.sizeProfileValue}>{closet.sizeProfile.waist}</span>
                                    </div>
                                    <div className={styles.sizeProfileItem}>
                                        <span className={styles.sizeProfileLabel}>Hips:</span>
                                        <span className={styles.sizeProfileValue}>{closet.sizeProfile.hips}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <h1 className={styles.title}>{outfit.title}</h1>

                <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>Rental Price</span>
                    <span className={styles.price}>₹{outfit.perNightPrice}/night</span>
                </div>

                <p className={styles.description}>{outfit.description}</p>

                <div className={styles.tags}>
                    <span className={styles.tag}>Size {outfit.size}</span>
                    {outfit.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                </div>

                {/* Outfit Category Section */}
                <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>Outfit Category</h3>
                    <p className={styles.categoryValue}>{outfit.category}</p>
                </div>

                {/* Date Selection Section */}
                <div className={styles.dateSection}>
                    <h2 className={styles.sectionTitle}>Select Rental Dates</h2>
                    <DateRangePicker
                        blockedDates={blockedDates}
                        onDateSelect={handleDateSelect}
                        onDateClear={handleDateClear}
                        perNightPrice={outfit.perNightPrice}
                        minNights={1}
                    />
                </div>

                {/* Terms & Policies */}
                <div className={styles.policies}>
                    <h3 className={styles.policiesTitle}>Important Terms</h3>
                    <ul className={styles.policyList}>
                        <li>
                            <strong>Security Deposit:</strong> ₹{outfit.perNightPrice} (1 night) - Refunded after return inspection
                        </li>
                        <li>
                            <strong>Extension Charges:</strong> If not returned on time, additional night charges will apply
                        </li>
                        <li>
                            <strong>Damage Policy:</strong> Minor damage = deposit forfeited. Major damage = full outfit cost charged
                        </li>
                        <li>
                            <strong>Delivery:</strong> ₹25 each way (included in total)
                        </li>
                    </ul>
                </div>
            </div>

            <div className={styles.stickyCTA}>
                <div className={styles.ctaButtons}>
                    {inCart ? (
                        <Button className={styles.cartButton} onClick={() => router.push('/cart')}>
                            <Check size={20} />
                            View Cart
                        </Button>
                    ) : (
                        <Button className={styles.cartButton} variant="secondary" onClick={handleAddToCart}>
                            <ShoppingBag size={20} />
                            Add to Cart
                        </Button>
                    )}
                    <Button
                        className={styles.ctaButton}
                        onClick={handleRentNow}
                        disabled={!selectedDates}
                    >
                        {selectedDates ? `Rent Now (${selectedDates.nights} nights)` : 'Select Dates'}
                    </Button>
                </div>
            </div>
        </main>
    );
}
