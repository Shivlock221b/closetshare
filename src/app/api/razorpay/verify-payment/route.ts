import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Mark this route as dynamic (uses request body)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

        // Generate signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        // Verify signature
        const verified = generatedSignature === razorpay_signature;

        return NextResponse.json({ verified });
    } catch (error) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment', verified: false },
            { status: 500 }
        );
    }
}
