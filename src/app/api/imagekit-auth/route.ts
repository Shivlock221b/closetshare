// File: app/api/imagekit-auth/route.ts
import { getUploadAuthParams } from "@imagekit/next/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // You can add your own authentication logic here
        // For example, check if user is logged in

        // Don't pass expire parameter - let getUploadAuthParams use its default
        // This ensures the signature matches the expire value
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
