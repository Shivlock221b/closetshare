// File: app/api/imagekit-auth/route.ts
import { getUploadAuthParams } from "@imagekit/next/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getUserByUid } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
    try {
        // Verify user is authenticated
        const authHeader = request.headers.get('authorization');
        const decodedToken = await verifyAuthToken(authHeader);

        if (!decodedToken) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in to upload images' },
                { status: 401 }
            );
        }

        // Get user data to check role
        const user = await getUserByUid(decodedToken.uid);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Only curators can upload images
        if (user.role !== 'curator') {
            return NextResponse.json(
                { error: 'Forbidden - Only curators can upload images' },
                { status: 403 }
            );
        }

        // Generate upload authentication parameters
        const authParams = getUploadAuthParams({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
            publicKey: process.env.NEXT_IMAGEKIT_PUBLIC_KEY as string,
        });

        return NextResponse.json({
            token: authParams.token,
            expire: authParams.expire,
            signature: authParams.signature,
            publicKey: process.env.NEXT_IMAGEKIT_PUBLIC_KEY,
        });
    } catch (error) {
        console.error('[ImageKit Auth] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate upload parameters' },
            { status: 500 }
        );
    }
}
