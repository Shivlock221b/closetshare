import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const { amount } = await request.json();

        // Create order
        const order = await razorpay.orders.create({
            amount: amount, // amount in smallest currency unit (paise for INR)
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        });

        return NextResponse.json({ orderId: order.id });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
