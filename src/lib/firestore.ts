import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Rental, Outfit, Closet, TimelineEntry, RentalStatus, Rating } from '@/types';

/**
 * Create a new rental in Firestore
 */
export const createRental = async (rentalData: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const rentalsRef = collection(db, 'rentals');
        const docRef = await addDoc(rentalsRef, {
            ...rentalData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating rental:', error);
        throw error;
    }
};

/**
 * Update rental status with timeline entry
 */
export const updateRentalStatus = async (
    rentalId: string,
    status: Rental['status'],
    note?: string,
    link?: string,
    paymentDetails?: {
        razorpayPaymentId?: string;
        razorpayOrderId?: string;
        razorpaySignature?: string;
    }
): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (!rentalSnap.exists()) {
            throw new Error('Rental not found');
        }

        const currentRental = rentalSnap.data() as Rental;
        const currentTimeline = currentRental.timeline || [];

        // Build timeline entry without undefined values (Firebase doesn't accept undefined)
        const newTimelineEntry: TimelineEntry = {
            status,
            timestamp: Date.now(),
        };
        if (note) newTimelineEntry.note = note;
        if (link) newTimelineEntry.link = link;

        const updateData: Record<string, unknown> = {
            status,
            timeline: [...currentTimeline, newTimelineEntry],
            updatedAt: serverTimestamp(),
        };

        // Initialize deliveryQC when status changes to 'delivered'
        if (status === 'delivered' && (!currentRental.deliveryQC || currentRental.deliveryQC.status !== 'pending')) {
            updateData.deliveryQC = {
                status: 'pending',
                deadline: Date.now() + 30 * 60 * 1000, // 30 minutes from now
            };
        }

        // Initialize returnQC when status changes to 'return_delivered'
        if (status === 'return_delivered' && (!currentRental.returnQC || currentRental.returnQC.status !== 'pending')) {
            updateData.returnQC = {
                status: 'pending',
                deadline: Date.now() + 30 * 60 * 1000, // 30 minutes from now
            };
        }

        if (paymentDetails) {
            updateData['paymentDetails.razorpayPaymentId'] = paymentDetails.razorpayPaymentId;
            updateData['paymentDetails.razorpayOrderId'] = paymentDetails.razorpayOrderId;
            updateData['paymentDetails.razorpaySignature'] = paymentDetails.razorpaySignature;
        }

        await updateDoc(rentalRef, updateData);

        // Unblock dates when rental is cancelled or rejected
        if (status === 'cancelled' || status === 'rejected') {
            await unblockDatesForRental(
                currentRental.outfitId,
                currentRental.startDate,
                currentRental.endDate
            );
        }

        // Update stats when rental is completed
        if (status === 'completed') {
            // Increment outfit rental count
            await updateOutfitStats(currentRental.outfitId, { rentalsCount: 1 });

            // Increment closet rental count and add earnings
            await updateClosetStats(currentRental.curatorId, {
                rentalsCount: 1,
                earnings: currentRental.curatorEarnings,
            });
        }
    } catch (error) {
        console.error('Error updating rental status:', error);
        throw error;
    }
};

/**
 * Update rental tracking information
 */
export const updateRentalTracking = async (
    rentalId: string,
    tracking: {
        courierName?: string;
        trackingNumber?: string;
        estimatedDelivery?: number;
    }
): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        await updateDoc(rentalRef, {
            tracking,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating rental tracking:', error);
        throw error;
    }
};

/**
 * Get outfit by ID
 */
export const getOutfitById = async (outfitId: string): Promise<Outfit | null> => {
    try {
        const outfitRef = doc(db, 'outfits', outfitId);
        const outfitSnap = await getDoc(outfitRef);

        if (outfitSnap.exists()) {
            return { id: outfitSnap.id, ...outfitSnap.data() } as Outfit;
        }

        return null;
    } catch (error) {
        console.error('Error getting outfit:', error);
        return null;
    }
};

/**
 * Get rental by ID
 */
export const getRentalById = async (rentalId: string): Promise<Rental | null> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (rentalSnap.exists()) {
            return { id: rentalSnap.id, ...rentalSnap.data() } as Rental;
        }

        return null;
    } catch (error) {
        console.error('Error getting rental:', error);
        return null;
    }
};

/**
 * Create a new outfit
 */
export const createOutfit = async (outfitData: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const outfitsRef = collection(db, 'outfits');
        const docRef = await addDoc(outfitsRef, {
            ...outfitData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating outfit:', error);
        throw error;
    }
};

/**
 * Update an existing outfit
 */
export const updateOutfit = async (outfitId: string, data: Partial<Outfit>): Promise<void> => {
    try {
        const outfitRef = doc(db, 'outfits', outfitId);
        await updateDoc(outfitRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating outfit:', error);
        throw error;
    }
};

/**
 * Delete an outfit
 */
export const deleteOutfit = async (outfitId: string): Promise<void> => {
    try {
        const outfitRef = doc(db, 'outfits', outfitId);
        await deleteDoc(outfitRef);
    } catch (error) {
        console.error('Error deleting outfit:', error);
        throw error;
    }
};

/**
 * Get all outfits for a curator
 */
export const getOutfitsByCurator = async (curatorId: string): Promise<Outfit[]> => {
    try {
        const outfitsRef = collection(db, 'outfits');
        const q = query(outfitsRef, where('curatorId', '==', curatorId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Outfit));
    } catch (error) {
        console.error('Error getting outfits by curator:', error);
        return [];
    }
};

/**
 * Update curator profile (closet document)
 */
export const updateCuratorProfile = async (
    curatorId: string,
    profileData: {
        displayName?: string;
        bio?: string;
        mobileNumber?: string;
        upiId?: string;
        avatarUrl?: string;
        slug?: string;
        socialLinks?: {
            instagram?: string;
            pinterest?: string;
            website?: string;
        };
        pickupAddress?: {
            fullName: string;
            phone: string;
            addressLine1: string;
            city: string;
            state: string;
            zipCode: string;
        };
        sizeProfile?: {
            height?: string;
            bodyType?: string;
            shoeSize?: string;
            bustChest?: string;
            waist?: string;
            hips?: string;
        };
    }
): Promise<void> => {
    try {
        const closetRef = doc(db, 'closets', curatorId);
        const closetSnap = await getDoc(closetRef);

        // Helper function to remove undefined values from an object
        const removeUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
            const cleaned: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== undefined) {
                    cleaned[key] = value;
                }
            }
            return cleaned;
        };

        // Clean socialLinks - convert undefined to empty string
        const cleanedSocialLinks = profileData.socialLinks ? {
            instagram: profileData.socialLinks.instagram || '',
            pinterest: profileData.socialLinks.pinterest || '',
            website: profileData.socialLinks.website || '',
        } : undefined;

        // Build clean update data
        const cleanedData: Record<string, unknown> = {};
        if (profileData.displayName !== undefined) cleanedData.displayName = profileData.displayName;
        if (profileData.bio !== undefined) cleanedData.bio = profileData.bio;
        if (profileData.mobileNumber !== undefined) cleanedData.mobileNumber = profileData.mobileNumber;
        if (profileData.upiId !== undefined) cleanedData.upiId = profileData.upiId;
        if (profileData.avatarUrl !== undefined) cleanedData.avatarUrl = profileData.avatarUrl;
        if (profileData.slug !== undefined) cleanedData.slug = profileData.slug;
        if (cleanedSocialLinks !== undefined) cleanedData.socialLinks = cleanedSocialLinks;
        if (profileData.pickupAddress !== undefined) cleanedData.pickupAddress = profileData.pickupAddress;
        if (profileData.sizeProfile !== undefined) cleanedData.sizeProfile = profileData.sizeProfile;

        if (closetSnap.exists()) {
            // Update existing closet
            await updateDoc(closetRef, {
                ...cleanedData,
                updatedAt: serverTimestamp(),
            });
        } else {
            // Create new closet if it doesn't exist
            const slug = generateClosetSlug(profileData.displayName || curatorId);
            await setDoc(closetRef, {
                curatorId,
                slug,
                displayName: profileData.displayName || 'Curator',
                bio: profileData.bio || '',
                avatarUrl: profileData.avatarUrl || '',
                mobileNumber: profileData.mobileNumber || '',
                upiId: profileData.upiId || '',
                socialLinks: cleanedSocialLinks || {
                    instagram: '',
                    pinterest: '',
                    website: '',
                },
                isPublished: false,
                stats: {
                    outfitsCount: 0,
                    rentalsCount: 0,
                    totalEarnings: 0,
                    rating: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error updating curator profile:', error);
        throw error;
    }
};

/**
 * Get all rentals for a curator's outfits
 */
export const getRentalsByCurator = async (curatorId: string): Promise<Rental[]> => {
    try {
        const rentalsRef = collection(db, 'rentals');
        const q = query(rentalsRef, where('curatorId', '==', curatorId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Rental));
    } catch (error) {
        console.error('Error getting rentals by curator:', error);
        return [];
    }
};

/**
 * Get all rentals for a user
 */
export const getRentalsByUser = async (userId: string): Promise<Rental[]> => {
    try {
        const rentalsRef = collection(db, 'rentals');
        const q = query(rentalsRef, where('renterUserId', '==', userId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Rental));
    } catch (error) {
        console.error('Error getting rentals by user:', error);
        return [];
    }
};

/**
 * Check if dates are available for an outfit
 */
export const checkAvailability = async (
    outfitId: string,
    startDate: number,
    endDate: number
): Promise<boolean> => {
    try {
        const outfit = await getOutfitById(outfitId);
        if (!outfit || !outfit.availability.enabled) {
            return false;
        }

        // Check if any blocked dates fall within the requested range
        const blockedDates = outfit.availability.blockedDates || [];
        const requestedDates = [];

        // Generate all dates in the range
        for (let date = startDate; date <= endDate; date += 86400000) {
            requestedDates.push(date);
        }

        // Check if any requested date is blocked
        const hasConflict = requestedDates.some(date =>
            blockedDates.some(blocked =>
                Math.abs(blocked - date) < 86400000 // Same day
            )
        );

        return !hasConflict;
    } catch (error) {
        console.error('Error checking availability:', error);
        return false;
    }
};

/**
 * Block dates for an outfit
 */
export const blockDatesForOutfit = async (
    outfitId: string,
    startDate: number,
    endDate: number
): Promise<void> => {
    try {
        const outfit = await getOutfitById(outfitId);
        if (!outfit) {
            throw new Error('Outfit not found');
        }

        const datesToBlock = [];
        for (let date = startDate; date <= endDate; date += 86400000) {
            datesToBlock.push(date);
        }

        const existingBlockedDates = outfit.availability.blockedDates || [];
        const updatedBlockedDates = [...existingBlockedDates, ...datesToBlock];

        await updateOutfit(outfitId, {
            availability: {
                ...outfit.availability,
                blockedDates: updatedBlockedDates,
            },
        });
    } catch (error) {
        console.error('Error blocking dates:', error);
        throw error;
    }
};

/**
 * Unblock dates for an outfit
 */
export const unblockDatesForOutfit = async (
    outfitId: string,
    startDate: number,
    endDate: number
): Promise<void> => {
    try {
        const outfit = await getOutfitById(outfitId);
        if (!outfit) {
            throw new Error('Outfit not found');
        }

        const datesToUnblock: number[] = [];
        for (let date = startDate; date <= endDate; date += 86400000) {
            datesToUnblock.push(date);
        }

        const existingBlockedDates = outfit.availability.blockedDates || [];
        const updatedBlockedDates = existingBlockedDates.filter(
            blocked => !datesToUnblock.some(unblock => Math.abs(blocked - unblock) < 86400000)
        );

        await updateOutfit(outfitId, {
            availability: {
                ...outfit.availability,
                blockedDates: updatedBlockedDates,
            },
        });
    } catch (error) {
        console.error('Error unblocking dates:', error);
        throw error;
    }
};

/**
 * Get closet by curator ID
 */
export const getClosetByCurator = async (curatorId: string): Promise<Closet | null> => {
    try {
        const closetRef = doc(db, 'closets', curatorId);
        const closetSnap = await getDoc(closetRef);

        if (closetSnap.exists()) {
            return { id: closetSnap.id, ...closetSnap.data() } as Closet;
        }

        return null;
    } catch (error) {
        console.error('Error getting closet:', error);
        return null;
    }
};

/**
 * Create or update closet
 */
export const upsertCloset = async (closetData: Omit<Closet, 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
        const closetRef = doc(db, 'closets', closetData.curatorId);
        const closetSnap = await getDoc(closetRef);

        if (closetSnap.exists()) {
            await updateDoc(closetRef, {
                ...closetData,
                updatedAt: serverTimestamp(),
            });
        } else {
            await updateDoc(closetRef, {
                ...closetData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error upserting closet:', error);
        throw error;
    }
};

/**
 * Calculate nights between two dates
 */
export const calculateNights = (startDate: number, endDate: number): number => {
    const diffTime = Math.abs(endDate - startDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights;
};

/**
 * Update outfit stats (e.g., increment rentals count)
 */
export const updateOutfitStats = async (
    outfitId: string,
    updates: { rentalsCount?: number }
): Promise<void> => {
    try {
        const outfitRef = doc(db, 'outfits', outfitId);
        const outfitSnap = await getDoc(outfitRef);

        if (!outfitSnap.exists()) {
            throw new Error('Outfit not found');
        }

        const currentStats = outfitSnap.data().stats || { rentalsCount: 0, rating: 0 };

        await updateDoc(outfitRef, {
            'stats.rentalsCount': (currentStats.rentalsCount || 0) + (updates.rentalsCount || 0),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating outfit stats:', error);
        throw error;
    }
};

/**
 * Update closet stats (e.g., increment outfits count, add earnings)
 */
export const updateClosetStats = async (
    curatorId: string,
    updates: { outfitsCount?: number; rentalsCount?: number; earnings?: number }
): Promise<void> => {
    try {
        const closetRef = doc(db, 'closets', curatorId);
        const closetSnap = await getDoc(closetRef);

        if (!closetSnap.exists()) {
            // Create closet if it doesn't exist
            const userRef = doc(db, 'users', curatorId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();

            await setDoc(closetRef, {
                id: curatorId,
                curatorId,
                slug: generateClosetSlug(userData?.displayName || 'curator'),
                displayName: userData?.displayName || 'Curator',
                isPublished: false,
                stats: {
                    outfitsCount: updates.outfitsCount || 0,
                    rentalsCount: updates.rentalsCount || 0,
                    totalEarnings: updates.earnings || 0,
                    rating: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return;
        }

        const currentStats = closetSnap.data().stats || { outfitsCount: 0, rentalsCount: 0, totalEarnings: 0, rating: 0 };

        await updateDoc(closetRef, {
            'stats.outfitsCount': (currentStats.outfitsCount || 0) + (updates.outfitsCount || 0),
            'stats.rentalsCount': (currentStats.rentalsCount || 0) + (updates.rentalsCount || 0),
            'stats.totalEarnings': (currentStats.totalEarnings || 0) + (updates.earnings || 0),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating closet stats:', error);
        throw error;
    }
};

/**
 * Generate a unique closet slug from display name
 */
export const generateClosetSlug = (displayName: string): string => {
    const baseSlug = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
};

/**
 * Publish a curator's closet
 */
export const publishCloset = async (
    curatorId: string,
    details: {
        mobileNumber: string;
        upiId: string;
        bio?: string;
        displayName?: string;
        pickupAddress?: {
            fullName: string;
            phone: string;
            addressLine1: string;
            city: string;
            state: string;
            zipCode: string;
        };
        sizeProfile?: {
            height?: string;
            bodyType?: string;
            shoeSize?: string;
            bustChest?: string;
            waist?: string;
            hips?: string;
        };
    }
): Promise<string> => {
    try {
        const closetRef = doc(db, 'closets', curatorId);
        const closetSnap = await getDoc(closetRef);

        let slug: string;

        if (closetSnap.exists()) {
            // Update existing closet
            slug = closetSnap.data().slug;
            const updateData: Record<string, unknown> = {
                isPublished: true,
                mobileNumber: details.mobileNumber,
                upiId: details.upiId,
                bio: details.bio || closetSnap.data().bio || '',
                displayName: details.displayName || closetSnap.data().displayName || 'Curator',
                pickupAddress: details.pickupAddress || closetSnap.data().pickupAddress,
                publishedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Only include sizeProfile if it exists (Firestore doesn't accept undefined)
            const sizeProfile = details.sizeProfile || closetSnap.data().sizeProfile;
            if (sizeProfile) {
                updateData.sizeProfile = sizeProfile;
            }

            await updateDoc(closetRef, updateData);
        } else {
            // Create new closet
            slug = generateClosetSlug(details.displayName || 'curator');
            const newClosetData: Record<string, unknown> = {
                id: curatorId,
                curatorId,
                slug,
                displayName: details.displayName || 'Curator',
                bio: details.bio || '',
                isPublished: true,
                mobileNumber: details.mobileNumber,
                upiId: details.upiId,
                pickupAddress: details.pickupAddress,
                stats: {
                    outfitsCount: 0,
                    rentalsCount: 0,
                    totalEarnings: 0,
                    rating: 0,
                },
                publishedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Only include sizeProfile if it exists (Firestore doesn't accept undefined)
            if (details.sizeProfile) {
                newClosetData.sizeProfile = details.sizeProfile;
            }

            await setDoc(closetRef, newClosetData);
        }

        // Update user's curator profile
        const userRef = doc(db, 'users', curatorId);
        await updateDoc(userRef, {
            role: 'curator',
            publicClosetSlug: slug,
            'curatorProfile.isPublished': true,
            'curatorProfile.mobileNumber': details.mobileNumber,
            'curatorProfile.upiId': details.upiId,
            'curatorProfile.publishedAt': serverTimestamp(),
        });

        return slug;
    } catch (error) {
        console.error('Error publishing closet:', error);
        throw error;
    }
};

/**
 * Get closet by slug
 */
export const getClosetBySlug = async (slug: string): Promise<Closet | null> => {
    try {
        const closetsRef = collection(db, 'closets');
        const q = query(closetsRef, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Closet;
    } catch (error) {
        console.error('Error getting closet by slug:', error);
        throw error;
    }
};

/**
 * Calculate rental pricing with new model
 * - Security deposit = 1 night (refundable)
 * - Platform fee = ₹10 per night
 * - Delivery fee = ₹50 each way
 * - Curator gets 100% of rental fee
 */
export const calculateRentalPricing = (
    perNightPrice: number,
    nights: number
): {
    perNightPrice: number;
    nights: number;
    rentalFee: number;
    securityDeposit: number;
    platformFee: number;
    deliveryFee: number;
    returnDeliveryFee: number;
    total: number;
    curatorEarnings: number;
} => {
    const rentalFee = perNightPrice * nights;
    const securityDeposit = perNightPrice; // 1 night
    const platformFee = 10 * nights; // ₹10 per night
    const deliveryFee = 25; // ₹25 one way
    const returnDeliveryFee = 25; // ₹25 one way
    const total = rentalFee + securityDeposit + platformFee + deliveryFee + returnDeliveryFee;
    const curatorEarnings = rentalFee; // Curator gets 100% of rental fee

    return {
        perNightPrice,
        nights,
        rentalFee,
        securityDeposit,
        platformFee,
        deliveryFee,
        returnDeliveryFee,
        total,
        curatorEarnings,
    };
};

/**
 * Get blocked dates for an outfit (from existing rentals)
 */
export const getBlockedDates = async (outfitId: string): Promise<number[]> => {
    try {
        // Get outfit's manually blocked dates
        const outfit = await getOutfitById(outfitId);
        const manuallyBlocked = outfit?.availability?.blockedDates || [];

        // Get all active rentals for this outfit
        const rentalsRef = collection(db, 'rentals');
        const q = query(
            rentalsRef,
            where('outfitId', '==', outfitId),
            where('status', 'in', ['paid', 'accepted', 'shipped', 'delivered', 'in_use', 'return_shipped'])
        );
        const querySnapshot = await getDocs(q);

        const blockedFromRentals: number[] = [];

        querySnapshot.docs.forEach(doc => {
            const rental = doc.data() as Rental;
            // Block all dates from start to end + 1 buffer day
            const start = new Date(rental.startDate);
            const end = new Date(rental.endDate);

            // Add 1 day buffer after end date (for cleaning/return)
            end.setDate(end.getDate() + 1);

            const current = new Date(start);
            while (current <= end) {
                // Store as midnight timestamp
                const dateKey = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
                if (!blockedFromRentals.includes(dateKey)) {
                    blockedFromRentals.push(dateKey);
                }
                current.setDate(current.getDate() + 1);
            }
        });

        // Combine manually blocked and rental-blocked dates
        const allBlocked = [...new Set([...manuallyBlocked, ...blockedFromRentals])];
        return allBlocked;
    } catch (error) {
        console.error('Error getting blocked dates:', error);
        return [];
    }
};

/**
 * Block dates for a confirmed rental
 */
export const blockDatesForRental = async (
    outfitId: string,
    startDate: number,
    endDate: number
): Promise<void> => {
    try {
        const outfitRef = doc(db, 'outfits', outfitId);
        const outfitSnap = await getDoc(outfitRef);

        if (!outfitSnap.exists()) {
            throw new Error('Outfit not found');
        }

        const outfit = outfitSnap.data() as Outfit;
        const existingBlocked = outfit.availability?.blockedDates || [];

        // Generate dates to block (including 1 day buffer)
        const datesToBlock: number[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Add buffer day

        const current = new Date(start);
        while (current <= end) {
            const dateKey = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
            datesToBlock.push(dateKey);
            current.setDate(current.getDate() + 1);
        }

        // Merge with existing blocked dates
        const allBlocked = [...new Set([...existingBlocked, ...datesToBlock])];

        await updateDoc(outfitRef, {
            'availability.blockedDates': allBlocked,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error blocking dates:', error);
        throw error;
    }
};

/**
 * Unblock dates for a cancelled or rejected rental
 */
export const unblockDatesForRental = async (
    outfitId: string,
    startDate: number,
    endDate: number
): Promise<void> => {
    try {
        const outfitRef = doc(db, 'outfits', outfitId);
        const outfitSnap = await getDoc(outfitRef);

        if (!outfitSnap.exists()) {
            throw new Error('Outfit not found');
        }

        const outfit = outfitSnap.data() as Outfit;
        const existingBlocked = outfit.availability?.blockedDates || [];

        // Generate dates to unblock (including buffer day)
        const datesToUnblock: number[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Include buffer day

        const current = new Date(start);
        while (current <= end) {
            const dateKey = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
            datesToUnblock.push(dateKey);
            current.setDate(current.getDate() + 1);
        }

        // Remove dates from blocked list
        const updatedBlocked = existingBlocked.filter(
            blockedDate => !datesToUnblock.includes(blockedDate)
        );

        await updateDoc(outfitRef, {
            'availability.blockedDates': updatedBlocked,
            updatedAt: serverTimestamp(),
        });

        console.log(`[Firestore] Unblocked ${datesToUnblock.length} dates for outfit ${outfitId}`);
    } catch (error) {
        console.error('Error unblocking dates:', error);
        throw error;
    }
};

/**
 * Submit delivery QC (user confirms receipt)
 */
export const submitDeliveryQC = async (
    rentalId: string,
    qcData: {
        itemsReceived: boolean;
        conditionOk: boolean;
        sizeOk: boolean;
        issueDescription?: string;
        returnRequested?: boolean;
    }
): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (!rentalSnap.exists()) {
            throw new Error('Rental not found');
        }

        const rental = rentalSnap.data() as Rental;
        const allOk = qcData.itemsReceived && qcData.conditionOk && qcData.sizeOk;
        const status = allOk ? 'approved' : 'issue_reported';
        const newStatus = allOk ? 'in_use' : 'disputed';

        await updateDoc(rentalRef, {
            'deliveryQC.status': status,
            'deliveryQC.submittedAt': Date.now(),
            'deliveryQC.itemsReceived': qcData.itemsReceived,
            'deliveryQC.conditionOk': qcData.conditionOk,
            'deliveryQC.sizeOk': qcData.sizeOk,
            'deliveryQC.issueDescription': qcData.issueDescription || null,
            'deliveryQC.returnRequested': qcData.returnRequested || false,
            status: newStatus,
            timeline: [...rental.timeline, { status: newStatus, timestamp: Date.now(), note: allOk ? 'Delivery confirmed by user' : 'User reported issue with delivery' }],
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error submitting delivery QC:', error);
        throw error;
    }
};

/**
 * Submit return QC (curator confirms return condition)
 */
export const submitReturnQC = async (
    rentalId: string,
    qcData: {
        conditionOk: boolean;
        damageLevel: 'none' | 'minor' | 'major' | 'total';
        issueDescription?: string;
    }
): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (!rentalSnap.exists()) {
            throw new Error('Rental not found');
        }

        const rental = rentalSnap.data() as Rental;
        const status = qcData.conditionOk ? 'approved' : 'issue_reported';
        const depositRefunded = qcData.damageLevel === 'none';
        const newStatus = qcData.damageLevel === 'none' || qcData.damageLevel === 'minor' ? 'completed' : 'disputed';

        await updateDoc(rentalRef, {
            'returnQC.status': status,
            'returnQC.submittedAt': Date.now(),
            'returnQC.conditionOk': qcData.conditionOk,
            'returnQC.damageLevel': qcData.damageLevel,
            'returnQC.issueDescription': qcData.issueDescription || null,
            'returnQC.depositRefunded': depositRefunded,
            'returnQC.depositRefundedAt': depositRefunded ? Date.now() : null,
            status: newStatus,
            timeline: [...rental.timeline, {
                status: newStatus,
                timestamp: Date.now(),
                note: depositRefunded
                    ? 'Return confirmed, deposit refunded'
                    : `Return confirmed with ${qcData.damageLevel} damage`
            }],
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error submitting return QC:', error);
        throw error;
    }
};

/**
 * Submit an issue report (from user or curator)
 */
export const submitIssueReport = async (
    rentalId: string,
    reportData: {
        reporterId: string;
        reporterType: 'user' | 'curator';
        category: string;
        description: string;
        imageUrls: string[];
    }
): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (!rentalSnap.exists()) {
            throw new Error('Rental not found');
        }

        const rental = rentalSnap.data() as Rental;
        const reporterLabel = reportData.reporterType === 'user' ? 'User' : 'Curator';

        await updateDoc(rentalRef, {
            status: 'disputed',
            issueReport: {
                reporterId: reportData.reporterId,
                reporterType: reportData.reporterType,
                category: reportData.category,
                description: reportData.description,
                imageUrls: reportData.imageUrls,
                reportedAt: Date.now(),
            },
            timeline: [...rental.timeline, {
                status: 'disputed' as RentalStatus,
                timestamp: Date.now(),
                note: `${reporterLabel} reported an issue: ${reportData.category}. Under investigation.`
            }],
            updatedAt: serverTimestamp(),
        });

        console.log(`[Firestore] Issue report submitted for rental ${rentalId}`);
    } catch (error) {
        console.error('Error submitting issue report:', error);
        throw error;
    }
};

/**
 * Resolve an issue report (admin only)
 */
export const resolveIssueReport = async (
    rentalId: string,
    resolution: {
        newStatus: RentalStatus;
        note: string;
    }
): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (!rentalSnap.exists()) {
            throw new Error('Rental not found');
        }

        const rental = rentalSnap.data() as Rental;

        await updateDoc(rentalRef, {
            status: resolution.newStatus,
            'issueReport.resolvedAt': Date.now(),
            'issueReport.resolutionNote': resolution.note,
            timeline: [...rental.timeline, {
                status: resolution.newStatus,
                timestamp: Date.now(),
                note: `Issue resolved: ${resolution.note}`
            }],
            updatedAt: serverTimestamp(),
        });

        console.log(`[Firestore] Issue resolved for rental ${rentalId}`);
    } catch (error) {
        console.error('Error resolving issue report:', error);
        throw error;
    }
};

/**
 * Get all rentals (for admin)
 */
export const getAllRentals = async (): Promise<Rental[]> => {
    try {
        const rentalsRef = collection(db, 'rentals');
        const querySnapshot = await getDocs(rentalsRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Rental));
    } catch (error) {
        console.error('Error getting all rentals:', error);
        return [];
    }
};

/**
 * Get all closets (for admin)
 */
export const getAllClosets = async (): Promise<Closet[]> => {
    try {
        const closetsRef = collection(db, 'closets');
        const querySnapshot = await getDocs(closetsRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Closet));
    } catch (error) {
        console.error('Error getting all closets:', error);
        return [];
    }
};

/**
 * Get all outfits (for admin)
 */
export const getAllOutfits = async (): Promise<Outfit[]> => {
    try {
        const outfitsRef = collection(db, 'outfits');
        const querySnapshot = await getDocs(outfitsRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Outfit));
    } catch (error) {
        console.error('Error getting all outfits:', error);
        return [];
    }
};

/**
 * Delete a rental (admin)
 */
export const deleteRental = async (rentalId: string): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        await deleteDoc(rentalRef);
    } catch (error) {
        console.error('Error deleting rental:', error);
        throw error;
    }
};

/**
 * Delete a closet (admin)
 */
export const deleteCloset = async (closetId: string): Promise<void> => {
    try {
        const closetRef = doc(db, 'closets', closetId);
        await deleteDoc(closetRef);
    } catch (error) {
        console.error('Error deleting closet:', error);
        throw error;
    }
};

/**
 * Update a closet (admin)
 */
export const updateCloset = async (
    closetId: string,
    data: Partial<Omit<Closet, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const closetRef = doc(db, 'closets', closetId);

        // Remove undefined values
        const cleanedData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                cleanedData[key] = value;
            }
        }

        await updateDoc(closetRef, {
            ...cleanedData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating closet:', error);
        throw error;
    }
};

/**
 * Update a specific timeline entry (admin)
 */
export const updateRentalTimeline = async (
    rentalId: string,
    timelineIndex: number,
    updates: { note?: string; timestamp?: number }
): Promise<void> => {
    try {
        const rentalRef = doc(db, 'rentals', rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (!rentalSnap.exists()) {
            throw new Error('Rental not found');
        }

        const rental = rentalSnap.data() as Rental;
        const timeline = [...rental.timeline];

        if (timelineIndex < 0 || timelineIndex >= timeline.length) {
            throw new Error('Invalid timeline index');
        }

        // Update the specific timeline entry
        timeline[timelineIndex] = {
            ...timeline[timelineIndex],
            ...updates,
        };

        await updateDoc(rentalRef, {
            timeline,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating rental timeline:', error);
        throw error;
    }
};

/**
 * ============================================
 * RATING FUNCTIONS
 * ============================================
 */

/**
 * Check if user has already rated this rental
 */
export const hasUserRatedRental = async (
    rentalId: string,
    raterId: string
): Promise<boolean> => {
    try {
        const ratingsRef = collection(db, 'ratings');
        const q = query(
            ratingsRef,
            where('rentalId', '==', rentalId),
            where('raterId', '==', raterId)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking if user rated rental:', error);
        return false;
    }
};

/**
 * Get all curator ratings for a specific curator
 */
export const getRatingsForCurator = async (curatorId: string): Promise<Rating[]> => {
    try {
        const ratingsRef = collection(db, 'ratings');
        const q = query(
            ratingsRef,
            where('ratedUserId', '==', curatorId),
            where('ratingType', '==', 'curator_rating')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Rating[];
    } catch (error) {
        console.error('Error getting curator ratings:', error);
        return [];
    }
};

/**
 * Get all user ratings for a specific user (admin only)
 */
export const getRatingsForUser = async (userId: string): Promise<Rating[]> => {
    try {
        const ratingsRef = collection(db, 'ratings');
        const q = query(
            ratingsRef,
            where('ratedUserId', '==', userId),
            where('ratingType', '==', 'user_rating')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Rating[];
    } catch (error) {
        console.error('Error getting user ratings:', error);
        return [];
    }
};

/**
 * Get ratings for a specific rental (both curator and user ratings)
 */
export const getRatingsForRental = async (
    rentalId: string
): Promise<{ curatorRating?: Rating; userRating?: Rating }> => {
    try {
        const ratingsRef = collection(db, 'ratings');
        const q = query(ratingsRef, where('rentalId', '==', rentalId));
        const querySnapshot = await getDocs(q);

        const result: { curatorRating?: Rating; userRating?: Rating } = {};

        querySnapshot.docs.forEach(doc => {
            const data = { id: doc.id, ...doc.data() } as Rating;
            if (data.ratingType === 'curator_rating') {
                result.curatorRating = data;
            } else if (data.ratingType === 'user_rating') {
                result.userRating = data;
            }
        });

        return result;
    } catch (error) {
        console.error('Error getting ratings for rental:', error);
        return {};
    }
};

/**
 * Recalculate average rating for a curator or user
 * Internal helper function
 */
const recalculateRating = async (
    userId: string,
    ratingType: 'curator_rating' | 'user_rating'
): Promise<void> => {
    try {
        const ratings = ratingType === 'curator_rating'
            ? await getRatingsForCurator(userId)
            : await getRatingsForUser(userId);

        // Calculate average, default to 0 if no ratings
        const average = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
            : 0;

        // Update the appropriate stats
        if (ratingType === 'curator_rating') {
            // Update closet rating
            const closetRef = doc(db, 'closets', userId);
            await updateDoc(closetRef, {
                'stats.rating': Number(average.toFixed(1)),
                updatedAt: serverTimestamp(),
            });
        } else {
            // Update user rating (for admin view)
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                await updateDoc(userRef, {
                    'stats.rating': Number(average.toFixed(1)),
                    updatedAt: serverTimestamp(),
                });
            }
        }

        console.log(`[Firestore] Updated ${ratingType} for user ${userId}: ${average.toFixed(1)}`);
    } catch (error) {
        console.error('Error recalculating rating:', error);
        throw error;
    }
};

/**
 * Submit a rating for a completed rental
 */
export const submitRating = async (ratingData: {
    rentalId: string;
    ratingType: 'curator_rating' | 'user_rating';
    raterId: string;
    ratedUserId: string;
    stars: number;
    comment: string;
}): Promise<string> => {
    try {
        // 1. Validate rental is completed
        const rentalRef = doc(db, 'rentals', ratingData.rentalId);
        const rentalSnap = await getDoc(rentalRef);

        if (!rentalSnap.exists()) {
            throw new Error('Rental not found');
        }

        const rental = rentalSnap.data();
        if (rental.status !== 'completed') {
            throw new Error('Can only rate completed rentals');
        }

        // 2. Check for duplicate rating
        const alreadyRated = await hasUserRatedRental(ratingData.rentalId, ratingData.raterId);
        if (alreadyRated) {
            throw new Error('You have already rated this rental');
        }

        // 3. Validate stars
        if (ratingData.stars < 1 || ratingData.stars > 5) {
            throw new Error('Rating must be between 1 and 5 stars');
        }

        // 4. Create rating document
        const ratingsRef = collection(db, 'ratings');
        const docRef = await addDoc(ratingsRef, {
            rentalId: ratingData.rentalId,
            ratingType: ratingData.ratingType,
            raterId: ratingData.raterId,
            ratedUserId: ratingData.ratedUserId,
            stars: ratingData.stars,
            comment: ratingData.comment || '',
            createdAt: Date.now(),
            isLocked: true,
        });

        // 5. Recalculate average rating
        await recalculateRating(ratingData.ratedUserId, ratingData.ratingType);

        console.log(`[Firestore] Rating submitted: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error('Error submitting rating:', error);
        throw error;
    }
};

// ============================================================================
// Error Logs
// ============================================================================

export interface ErrorLog {
    id: string;
    timestamp: number;
    message: string;
    stack?: string;
    userId?: string;
    userEmail?: string;
    route?: string;
    userAgent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'runtime' | 'network' | 'payment' | 'auth' | 'data' | 'other';
    metadata?: Record<string, any>;
    resolved?: boolean;
    createdAt?: any;
}

/**
 * Get all error logs (admin only)
 */
export const getAllErrorLogs = async (): Promise<ErrorLog[]> => {
    try {
        const errorLogsRef = collection(db, 'errorLogs');
        const snapshot = await getDocs(errorLogsRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as ErrorLog[];
    } catch (error) {
        console.error('Error fetching error logs:', error);
        throw error;
    }
};

/**
 * Mark an error log as resolved (admin only)
 */
export const markErrorResolved = async (errorId: string, resolved: boolean = true): Promise<void> => {
    try {
        const errorRef = doc(db, 'errorLogs', errorId);
        await updateDoc(errorRef, {
            resolved,
            resolvedAt: resolved ? serverTimestamp() : null,
        });
    } catch (error) {
        console.error('Error marking error as resolved:', error);
        throw error;
    }
};

/**
 * Delete an error log (admin only)
 */
export const deleteErrorLog = async (errorId: string): Promise<void> => {
    try {
        const errorRef = doc(db, 'errorLogs', errorId);
        await deleteDoc(errorRef);
    } catch (error) {
        console.error('Error deleting error log:', error);
        throw error;
    }
};
