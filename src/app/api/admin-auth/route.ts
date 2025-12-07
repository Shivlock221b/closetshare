import { NextResponse } from 'next/server';

// Mark this route as dynamic (uses request body)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { passcode } = await request.json();
        const adminSecret = process.env.ADMIN_SECRET;

        if (!adminSecret) {
            return NextResponse.json({ error: 'Admin secret not configured' }, { status: 500 });
        }

        if (passcode === adminSecret) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
        }
    } catch (error) {
        console.error('Admin auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
