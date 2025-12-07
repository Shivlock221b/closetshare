'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '@/lib/razorpay';
import {
    createRental,
    updateRentalStatus,
    getOutfitById,
    getClosetByCurator,
    calculateRentalPricing,
    blockDatesForRental
} from '@/lib/firestore';
import { Outfit, Closet } from '@/types';

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;

    const { user, loading: authLoading, signIn } = useAuth();
    const [signingIn, setSigningIn] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const [outfit, setOutfit] = useState<Outfit | null>(null);
    const [closet, setCloset] = useState<Closet | null>(null);
    const [loading, setLoading] = useState(true);

    // Get dates from URL params
    const startTimestamp = searchParams.get('start');
    const endTimestamp = searchParams.get('end');
    const nightsParam = searchParams.get('nights');

    const startDate = startTimestamp ? new Date(parseInt(startTimestamp)) : null;
    const endDate = endTimestamp ? new Date(parseInt(endTimestamp)) : null;
    const nights = nightsParam ? parseInt(nightsParam) : 0;

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
    });

    // Fetch outfit data
    useEffect(() => {
        const fetchOutfit = async () => {
            try {
                const outfitData = await getOutfitById(id);
                if (outfitData) {
                    setOutfit(outfitData);
                    const closetData = await getClosetByCurator(outfitData.curatorId);
                    setCloset(closetData);
                }
            } catch (error) {
                console.error('[Checkout] Error fetching outfit:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOutfit();
    }, [id]);

    // Pre-fill form with user data if authenticated
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.displayName || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSignIn = async () => {
        setSigningIn(true);
        try {
            await signIn();
        } catch (error) {
            console.error('Sign in error:', error);
            alert('Failed to sign in. Please try again.');
        } finally {
            setSigningIn(false);
        }
    };

    const handlePayment = async () => {
        if (!user || !outfit || !startDate || !endDate) {
            alert('Please sign in and select dates to continue');
            return;
        }

        if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zip) {
            alert('Please fill in all required fields');
            return;
        }

        setProcessingPayment(true);

        try {
            // Calculate pricing with new model
            const pricing = calculateRentalPricing(outfit.perNightPrice, nights);
            const amountInPaise = pricing.total * 100;

            // Create rental in Firestore
            const rentalId = await createRental({
                outfitId: id,
                curatorId: outfit.curatorId,
                renterUserId: user.id,
                renterEmail: user.email,
                renterName: formData.fullName,
                status: 'requested',
                startDate: startDate.getTime(),
                endDate: endDate.getTime(),
                nights: nights,
                deliveryAddress: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    addressLine1: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zip,
                },
                pricing: {
                    perNightPrice: pricing.perNightPrice,
                    nights: pricing.nights,
                    rentalFee: pricing.rentalFee,
                    securityDeposit: pricing.securityDeposit,
                    platformFee: pricing.platformFee,
                    deliveryFee: pricing.deliveryFee,
                    returnDeliveryFee: pricing.returnDeliveryFee,
                    total: pricing.total,
                },
                timeline: [{ status: 'requested', timestamp: Date.now() }],
                curatorEarnings: pricing.curatorEarnings,
            });

            // Create Razorpay order
            const { orderId } = await createRazorpayOrder(amountInPaise);

            // Open Razorpay checkout
            await openRazorpayCheckout({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: amountInPaise,
                currency: 'INR',
                name: 'ClosetShare.in',
                description: `Rental: ${outfit.title} (${nights} nights)`,
                order_id: orderId,
                prefill: {
                    name: formData.fullName,
                    email: user.email,
                    contact: formData.phone,
                },
                theme: {
                    color: '#FF7F6A',
                },
                handler: async (response) => {
                    try {
                        const verified = await verifyRazorpayPayment(
                            response.razorpay_payment_id,
                            response.razorpay_order_id,
                            response.razorpay_signature
                        );

                        if (verified) {
                            // Update rental status
                            await updateRentalStatus(rentalId, 'paid', 'Payment completed', undefined, {
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature,
                            });

                            // Block dates for this outfit
                            await blockDatesForRental(id, startDate.getTime(), endDate.getTime());

                            alert('Payment successful! Your rental request has been confirmed.');
                            router.push(`/order-status/${rentalId}`);
                        } else {
                            alert('Payment verification failed. Please contact support.');
                            // Cancel the rental
                            await updateRentalStatus(rentalId, 'cancelled', 'Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Payment handler error:', error);
                        alert('An error occurred during payment processing. Please contact support.');
                    } finally {
                        setProcessingPayment(false);
                    }
                },
                modal: {
                    ondismiss: async () => {
                        console.log('Payment popup closed by user');

                        // Cancel the rental since payment was not completed
                        try {
                            await updateRentalStatus(rentalId, 'cancelled', 'Payment cancelled by user');
                        } catch (error) {
                            console.error('Error cancelling rental:', error);
                        }

                        // Reset UI state
                        setProcessingPayment(false);

                        // Show user-friendly message
                        const shouldRetry = confirm(
                            'Payment was cancelled. Would you like to try again?'
                        );

                        if (!shouldRetry) {
                            // Redirect to outfit page
                            router.push(`/outfit/${id}`);
                        }
                    },
                    escape: true,
                    backdropclose: true,
                },
            });
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
            setProcessingPayment(false);
        }
    };

    // Show loading state
    if (loading || authLoading) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
                </div>
            </main>
        );
    }

    // Show error if outfit not found
    if (!outfit) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div className={styles.signInPrompt}>
                        <h1 className="text-serif" style={{ fontSize: '2rem', marginBottom: '16px' }}>Outfit Not Found</h1>
                        <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
                            The outfit you're trying to rent doesn't exist.
                        </p>
                        <Button onClick={() => router.push('/')}>Go Home</Button>
                    </div>
                </div>
            </main>
        );
    }

    // Show error if no dates selected
    if (!startDate || !endDate || nights === 0) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div className={styles.signInPrompt}>
                        <h1 className="text-serif" style={{ fontSize: '2rem', marginBottom: '16px' }}>Select Dates First</h1>
                        <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
                            Please go back and select your rental dates.
                        </p>
                        <Button onClick={() => router.push(`/outfit/${id}`)}>Select Dates</Button>
                    </div>
                </div>
            </main>
        );
    }

    // Show sign-in prompt if not authenticated
    if (!user) {
        return (
            <main>
                <Header />
                <div className={styles.container}>
                    <div className={styles.signInPrompt}>
                        <h1 className="text-serif" style={{ fontSize: '2rem', marginBottom: '16px' }}>Sign in to Continue</h1>
                        <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
                            Please sign in with your Google account to complete your rental.
                        </p>
                        <Button onClick={handleSignIn} disabled={signingIn} size="lg">
                            {signingIn ? 'Signing in...' : 'Sign in with Google'}
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    // Calculate pricing
    const pricing = calculateRentalPricing(outfit.perNightPrice, nights);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <h1 className="text-serif" style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Checkout</h1>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Rental Summary</h2>
                    <div className={styles.summaryRow}>
                        <img src={outfit.images[0]} alt={outfit.title} className={styles.thumbnail} />
                        <div className={styles.summaryDetails}>
                            <div className={styles.outfitTitle}>{outfit.title}</div>
                            <div className={styles.curatorName}>by {closet?.displayName || 'Curator'}</div>
                            <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                                {formatDate(startDate)} - {formatDate(endDate)} ({nights} nights)
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Delivery Details</h2>
                    <div className={styles.formGrid}>
                        <Input
                            id="fullName"
                            label="Full Name *"
                            placeholder="Jane Doe"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            id="phone"
                            label="Phone Number *"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            id="email"
                            label="Email"
                            placeholder="jane@example.com"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled
                        />
                        <Input
                            id="address"
                            label="Address *"
                            placeholder="123 Fashion St"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            id="state"
                            label="State *"
                            placeholder="Maharashtra"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Input
                                id="city"
                                label="City *"
                                placeholder="Mumbai"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                id="zip"
                                label="PIN Code *"
                                placeholder="400001"
                                value={formData.zip}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Payment Summary</h2>
                    <div className={styles.paymentSummary}>
                        <div className={styles.summaryLine}>
                            <span>Rental ({nights} nights × ₹{pricing.perNightPrice})</span>
                            <span>₹{pricing.rentalFee}</span>
                        </div>
                        <div className={styles.summaryLine}>
                            <span>Security Deposit (1 night, refundable)</span>
                            <span>₹{pricing.securityDeposit}</span>
                        </div>
                        <div className={styles.summaryLine}>
                            <span>Platform Fee (₹10 × {nights} nights)</span>
                            <span>₹{pricing.platformFee}</span>
                        </div>
                        <div className={styles.summaryLine}>
                            <span>Delivery (one way)</span>
                            <span>₹{pricing.deliveryFee}</span>
                        </div>
                        <div className={styles.summaryLine}>
                            <span>Return Delivery (one way)</span>
                            <span>₹{pricing.returnDeliveryFee}</span>
                        </div>
                        <div className={styles.totalLine}>
                            <span>Total</span>
                            <span>₹{pricing.total}</span>
                        </div>
                    </div>

                    <div className={styles.termsNote}>
                        <p><strong>By proceeding, you agree to:</strong></p>
                        <ul>
                            <li>Return the outfit by {formatDate(endDate)}</li>
                            <li>Extension charges apply if not returned on time (₹{pricing.perNightPrice}/night)</li>
                            <li>Security deposit will be refunded after return quality check</li>
                            <li>Damage or loss may result in additional charges up to full outfit value</li>
                        </ul>
                    </div>
                </section>

                <div className={styles.stickyFooter}>
                    <Button
                        className={styles.confirmBtn}
                        onClick={handlePayment}
                        disabled={processingPayment}
                    >
                        {processingPayment ? 'Processing...' : `Pay ₹${pricing.total}`}
                    </Button>
                </div>
            </div>
        </main>
    );
}
