export type UserRole = 'curator' | 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    role: 'user' | 'curator';
    bio?: string;
    stats?: {
        outfitsCount: number;
        rentalsCount: number;
        rating: number;
    };
    publicClosetSlug?: string;
    curatorProfile?: {
        isPublished: boolean;
        mobileNumber?: string;
        upiId?: string;
        publishedAt?: number;
    };
}

export type OutfitStatus = 'active' | 'archived';

export type CleaningType = 'wash_iron' | 'dry_clean';

export type OutfitCategory =
    | 'Winter wear'
    | 'Summer wear'
    | 'Party wear'
    | 'Professional/Corporate wear'
    | 'Ethnic wear'
    | 'Westernwear'
    | 'Footwear'
    | 'Accessories';

export type OutfitIncludedItem =
    | 'Dress'
    | 'Top'
    | 'Bottom'
    | 'Outerwear'
    | 'Shoes'
    | 'Accessories'
    | 'Complete Set';

export interface Outfit {
    id: string;
    curatorId: string;
    title: string;
    description: string;
    images: string[];
    size: string;
    category: string; // Using string to allow flexibility but we'll enforce values in UI
    perNightPrice: number;
    securityDeposit: number; // Now equals perNightPrice (1 night)
    retailPrice: number; // Full cost of the outfit
    itemsIncluded: string[]; // List of items included in the rent
    cleaningType: CleaningType; // Wash & Iron or Dry Clean
    tags: string[];
    availability: {
        enabled: boolean;
        blockedDates: number[]; // Array of date timestamps (midnight UTC)
    };
    status: OutfitStatus;
    stats: {
        rentalsCount: number;
        rating: number;
    };
    createdAt: number;
    updatedAt: number;
}

export type RentalStatus =
    | 'requested'
    | 'paid'
    | 'accepted'
    | 'shipped'           // Curator shipped to user
    | 'delivered'         // Delivered, awaiting user QC (30 min window)
    | 'in_use'            // User confirmed receipt, rental period active
    | 'return_shipped'    // User shipped return
    | 'return_delivered'  // Curator received, awaiting curator QC (30 min window)
    | 'completed'         // QC passed, deposit refunded
    | 'rejected'          // Curator rejected request
    | 'cancelled'         // User/admin cancelled
    | 'disputed';         // QC issue raised, needs admin attention

export type QCStatus = 'pending' | 'approved' | 'issue_reported' | 'auto_approved';

export type DamageLevel = 'none' | 'minor' | 'major' | 'total';

export interface DeliveryQC {
    status: QCStatus;
    submittedAt?: number;
    deadline: number;              // 30 min after delivery timestamp
    itemsReceived?: boolean;
    conditionOk?: boolean;
    sizeOk?: boolean;
    issueDescription?: string;
    issueImages?: string[];
    returnRequested?: boolean;
}

export interface ReturnQC {
    status: QCStatus;
    submittedAt?: number;
    deadline: number;              // 30 min after return delivery timestamp
    conditionOk?: boolean;
    damageLevel?: DamageLevel;
    issueDescription?: string;
    issueImages?: string[];
    depositRefunded?: boolean;
    depositRefundedAt?: number;
}

export interface TimelineEntry {
    status: RentalStatus;
    timestamp: number;
    note?: string;
    link?: string; // Clickable URL for tracking, feedback forms, etc.
}

export interface IssueReport {
    reporterId: string;
    reporterType: 'user' | 'curator';
    category: string;
    description: string;
    imageUrls: string[];
    reportedAt: number;
    resolvedAt?: number;
    resolutionNote?: string;
}

export type RatingType = 'curator_rating' | 'user_rating';

export interface Rating {
    id: string;
    rentalId: string;
    ratingType: RatingType;
    raterId: string;        // User who gave the rating
    ratedUserId: string;    // User who received the rating
    stars: number;          // 1-5
    comment: string;        // Can be empty
    createdAt: number;
    isLocked: true;         // Always true - no editing allowed
}

export interface Rental {
    id: string;
    outfitId: string;
    curatorId: string;
    renterUserId: string;
    renterEmail: string;
    renterName: string;
    status: RentalStatus;
    startDate: number;
    endDate: number;
    nights: number;
    deliveryAddress: {
        fullName: string;
        phone: string;
        addressLine1: string;
        city: string;
        state: string;
        zipCode: string;
    };
    pricing: {
        perNightPrice: number;
        nights: number;
        rentalFee: number;         // perNightPrice * nights (goes to curator)
        securityDeposit: number;   // = perNightPrice (1 night, refundable)
        platformFee: number;       // ₹10 * nights (goes to platform)
        deliveryFee: number;       // ₹50 one way
        returnDeliveryFee: number; // ₹50 one way
        total: number;             // Sum of all above
    };
    tracking?: {
        courierName?: string;
        trackingNumber?: string;
        estimatedDelivery?: number;
    };
    returnTracking?: {
        courierName?: string;
        trackingNumber?: string;
        estimatedDelivery?: number;
    };
    paymentDetails?: {
        razorpayPaymentId: string;
        razorpayOrderId: string;
        razorpaySignature: string;
    };
    deliveryQC?: DeliveryQC;
    returnQC?: ReturnQC;
    issueReport?: IssueReport;
    timeline: TimelineEntry[];
    curatorEarnings: number; // rentalFee + securityDeposit (if not refunded due to damage)
    createdAt: number;
    updatedAt: number;
}

export type BodyType = 'petite' | 'slim' | 'athletic' | 'curvy' | 'plus-size';

export interface SizeProfile {
    height?: string;           // e.g., "5'7" or "170cm"
    bodyType?: BodyType;
    shoeSize?: string;         // e.g., "7" or "39"
    bustChest?: string;        // in inches or cm
    waist?: string;            // in inches or cm
    hips?: string;             // in inches or cm
}

export interface PickupAddress {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface Closet {
    id: string;
    curatorId: string;
    slug: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    isPublished: boolean;
    status: 'pending' | 'approved' | 'rejected'; // For curator verification
    mobileNumber?: string;
    upiId?: string;
    pickupAddress?: PickupAddress;
    sizeProfile?: SizeProfile;
    socialLinks?: {
        instagram?: string;
        pinterest?: string;
        website?: string;
    };
    stats: {
        outfitsCount: number;
        rentalsCount: number;
        totalEarnings: number;
        rating: number;
    };
    supportContact?: {
        email: string;
        phone: string;
    };
    publishedAt?: number;
    createdAt: number;
    updatedAt: number;
}

export type CuratorInviteStatus = 'pending' | 'claimed' | 'expired';

export interface CuratorInvite {
    id: string;
    token: string;
    curatorId: string;           // Pre-created curator ID (closet document ID)
    email: string;               // Email of the curator to invite
    displayName: string;         // Display name for the curator
    status: CuratorInviteStatus;
    createdAt: number;
    expiresAt: number;           // Token expiration time
    claimedAt?: number;
    claimedByUserId?: string;    // Firebase Auth UID after claiming
}
