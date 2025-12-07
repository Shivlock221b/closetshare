import { upload } from '@imagekit/next';
import { auth } from './firebase';

const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/closetshare';

/**
 * Upload a single image to ImageKit
 * @param file - The file to upload
 * @param folder - Folder path (e.g., 'outfits/curatorId/outfitId')
 * @param fileName - Optional custom filename
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (
    file: File,
    folder: string,
    fileName?: string
): Promise<string> => {
    try {
        // Get current user's ID token
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated to upload images');
        }

        const idToken = await user.getIdToken();

        // Fetch auth parameters from our API route with authentication
        const authResponse = await fetch('/api/imagekit-auth', {
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
        });

        if (!authResponse.ok) {
            const errorData = await authResponse.json();
            throw new Error(errorData.error || 'Failed to get upload auth');
        }

        const authParams = await authResponse.json();

        // Upload to ImageKit
        const result = await upload({
            file,
            fileName: fileName || file.name,
            folder,
            publicKey: authParams.publicKey as string,
            signature: authParams.signature,
            expire: authParams.expire,
            token: authParams.token,
        });

        if (!result.url) {
            throw new Error('Upload succeeded but no URL returned');
        }

        console.log('[ImageKit] Image uploaded:', result.url);
        return result.url;
    } catch (error) {
        console.error('[ImageKit] Error uploading image:', error);
        throw error;
    }
};

/**
 * Upload multiple images to ImageKit
 * @param files - Array of files to upload
 * @param folder - Folder path (e.g., 'outfits/curatorId/outfitId')
 * @returns Array of download URLs
 */
export const uploadMultipleImages = async (
    files: File[],
    folder: string
): Promise<string[]> => {
    try {
        console.log(`[ImageKit] Uploading ${files.length} images to ${folder}`);

        const uploadPromises = files.map((file, index) => {
            const fileName = `${Date.now()}_${index}_${file.name}`;
            return uploadImage(file, folder, fileName);
        });

        const urls = await Promise.all(uploadPromises);
        console.log('[ImageKit] All images uploaded successfully');
        return urls;
    } catch (error) {
        console.error('[ImageKit] Error uploading multiple images:', error);
        throw error;
    }
};

/**
 * Delete an image from ImageKit
 * Note: ImageKit requires fileId for deletion, which we don't store
 * For now, this is a placeholder - you may want to store fileIds in Firestore
 * @param url - The download URL of the image to delete
 */
export const deleteImage = async (url: string): Promise<void> => {
    try {
        // ImageKit deletion requires fileId which we don't have from URL
        // You would need to either:
        // 1. Store fileIds in Firestore when uploading
        // 2. Use ImageKit's server-side SDK to delete by URL
        // For now, we'll just log it
        console.log('[ImageKit] Delete requested for:', url);
        console.warn('[ImageKit] Deletion not implemented - requires fileId');
    } catch (error) {
        console.error('[ImageKit] Error deleting image:', error);
        throw error;
    }
};

/**
 * Get ImageKit URL for a path
 * @param path - Image path
 * @returns Full ImageKit URL
 */
export const getImageUrl = (path: string): string => {
    return `${IMAGEKIT_URL_ENDPOINT}/${path}`;
};

/**
 * Generate folder path for outfit images
 * @param curatorId - Curator's user ID
 * @param outfitId - Outfit ID
 * @returns Folder path
 */
export const getOutfitImagePath = (curatorId: string, outfitId: string): string => {
    return `outfits/${curatorId}/${outfitId}`;
};

/**
 * Generate folder path for user avatar
 * @param userId - User ID
 * @returns Folder path
 */
export const getUserAvatarPath = (userId: string): string => {
    return `users/${userId}`;
};
