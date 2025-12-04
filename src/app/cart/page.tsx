'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { getOutfitById } from '@/lib/firestore';
import { Outfit } from '@/types';
import styles from './page.module.css';

export default function CartPage() {
    const router = useRouter();
    const { cartItems, removeFromCart, clearCart } = useCart();
    const [outfits, setOutfits] = useState<(Outfit | null)[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOutfits = async () => {
            if (cartItems.length === 0) {
                setOutfits([]);
                setLoading(false);
                return;
            }

            try {
                const fetchedOutfits = await Promise.all(
                    cartItems.map(item => getOutfitById(item.outfitId))
                );
                setOutfits(fetchedOutfits);
            } catch (error) {
                console.error('[Cart] Error fetching outfits:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOutfits();
    }, [cartItems]);

    const calculateTotal = () => {
        return outfits.reduce((total, outfit) => {
            if (outfit) {
                return total + outfit.perNightPrice * 3; // Default 3 nights
            }
            return total;
        }, 0);
    };

    if (loading) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <p>Loading cart...</p>
                </div>
            </main>
        );
    }

    if (cartItems.length === 0) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div className={styles.emptyCart}>
                        <h1>Your Cart is Empty</h1>
                        <p>Looks like you haven't added any outfits yet.</p>
                        <Button onClick={() => router.push('/')}>Browse Closets</Button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Your Cart</h1>
                    <button className={styles.clearBtn} onClick={clearCart}>
                        Clear All
                    </button>
                </div>

                <div className={styles.cartItems}>
                    {outfits.map((outfit, index) => {
                        if (!outfit) return null;
                        const cartItem = cartItems[index];

                        return (
                            <div key={outfit.id} className={styles.cartItem}>
                                <Link href={`/outfit/${outfit.id}`} className={styles.itemImage}>
                                    <img src={outfit.images[0]} alt={outfit.title} />
                                </Link>
                                <div className={styles.itemDetails}>
                                    <Link href={`/outfit/${outfit.id}`} className={styles.itemTitle}>
                                        {outfit.title}
                                    </Link>
                                    <p className={styles.itemSize}>Size: {outfit.size}</p>
                                    <p className={styles.itemPrice}>₹{outfit.perNightPrice}/night</p>
                                    <p className={styles.itemSubtotal}>
                                        3 nights = ₹{outfit.perNightPrice * 3}
                                    </p>
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => removeFromCart(outfit.id)}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.summary}>
                    <div className={styles.summaryRow}>
                        <span>Subtotal ({cartItems.length} items)</span>
                        <span>₹{calculateTotal()}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Security Deposit</span>
                        <span>₹{outfits.filter(o => o).reduce((sum, o) => sum + (o?.securityDeposit || 0), 0)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Platform Fee</span>
                        <span>₹50</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>Total</span>
                        <span>
                            ₹{calculateTotal() + outfits.filter(o => o).reduce((sum, o) => sum + (o?.securityDeposit || 0), 0) + 50}
                        </span>
                    </div>
                </div>

                <div className={styles.actions}>
                    {cartItems.length === 1 && outfits[0] && (
                        <Button onClick={() => router.push(`/checkout/${outfits[0]?.id}`)}>
                            Proceed to Checkout
                        </Button>
                    )}
                    {cartItems.length > 1 && (
                        <p className={styles.multiItemNote}>
                            Currently, you can only checkout one outfit at a time. Please remove items until only one remains.
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
