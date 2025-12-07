import { NextRequest, NextResponse } from 'next/server';
import { updateRentalStatus, updateRentalTracking } from '@/lib/firestore';
import { RentalStatus } from '@/types';

// Mark this route as dynamic (uses request body and params)
export const dynamic = 'force-dynamic';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, note, tracking } = body;

        // Validate status
        const validStatuses: RentalStatus[] = [
            'requested',
            'paid',
            'accepted',
            'rejected',
            'shipped',
            'delivered',
            'in_use',
            'return_shipped',
            'return_delivered',
            'completed',
            'cancelled',
            'disputed',
        ];

        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Update status if provided
        if (status) {
            await updateRentalStatus(id, status, note);
        }

        // Update tracking if provided
        if (tracking) {
            await updateRentalTracking(id, tracking);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Rental Status API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to update rental' },
            { status: 500 }
        );
    }
}
