declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    handler: (response: RazorpayResponse) => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Load Razorpay script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Create Razorpay order on server
 */
export const createRazorpayOrder = async (amount: number): Promise<{ orderId: string }> => {
    try {
        const response = await fetch('/api/razorpay/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        const data = await response.json();
        return { orderId: data.orderId };
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

/**
 * Verify Razorpay payment on server
 */
export const verifyRazorpayPayment = async (
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
): Promise<boolean> => {
    try {
        const response = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                razorpay_payment_id: razorpayPaymentId,
                razorpay_order_id: razorpayOrderId,
                razorpay_signature: razorpaySignature,
            }),
        });

        if (!response.ok) {
            throw new Error('Payment verification failed');
        }

        const data = await response.json();
        return data.verified;
    } catch (error) {
        console.error('Error verifying payment:', error);
        return false;
    }
};

/**
 * Open Razorpay checkout
 */
export const openRazorpayCheckout = async (
    options: RazorpayOptions
): Promise<void> => {
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK');
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
};
