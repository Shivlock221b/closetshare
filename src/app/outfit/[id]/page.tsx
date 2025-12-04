'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Check, AlertCircle } from 'lucide-react';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
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
                if (outfitData) {
                    setOutfit(outfitData);
                    const closetData = await getClosetByCurator(outfitData.curatorId);
                    setCloset(closetData);

                    // Fetch blocked dates
                    const blocked = await getBlockedDates(id);
                    setBlockedDates(blocked);
                }
            } catch (error) {
                console.error('[OutfitPage] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleDateSelect = (startDate: Date, endDate: Date, nights: number) => {
        setSelectedDates({ startDate, endDate, nights });
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
                    <p>Loading outfit...</p>
                </div>
            </main>
        );
    }

    if (!outfit) {
        return (
            <main className={styles.container}>
                <Header />
                <div className={styles.errorState}>
                    <h1>Outfit Not Found</h1>
                    <p>The outfit you're looking for doesn't exist.</p>
                    <Button onClick={() => router.push('/')}>Go Home</Button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <Header />

            <div className={styles.hero}>
                <img src={outfit.images[0]} alt={outfit.title} className={styles.heroImage} />
            </div>

            <div className={styles.details}>
                {closet && (
                    <Link href={`/c/${closet.slug}`} className={styles.curatorRow}>
                        <img
                            src={closet.avatarUrl || 'https://via.placeholder.com/40'}
                            alt={closet.displayName}
                            className={styles.curatorAvatar}
                        />
                        <div>
                            <div className={styles.curatorName}>{closet.displayName}</div>
                            <div className={styles.curatorLabel}>curator</div>
                        </div>
                    </Link>
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

                {/* Date Selection Section */}
                <div className={styles.dateSection}>
                    <h2 className={styles.sectionTitle}>Select Rental Dates</h2>
                    <DateRangePicker
                        blockedDates={blockedDates}
                        onDateSelect={handleDateSelect}
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
                            <strong>Delivery:</strong> ₹50 each way (included in total)
                        </li>
                    </ul>
                </div>

                {outfit.images.length > 1 && (
                    <div className={styles.gallery}>
                        {outfit.images.slice(1).map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`${outfit.title} ${idx + 2}`}
                                className={styles.galleryImage}
                            />
                        ))}
                    </div>
                )}
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
