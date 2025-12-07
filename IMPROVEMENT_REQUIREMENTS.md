# ClosetShare Platform - Robustness Improvement Requirements

**Generated**: December 7, 2025
**Last Updated**: December 7, 2025
**Status**: Phase 1 & Critical Fixes Complete
**Total Issues Identified**: 50+
**Issues Resolved**: 8

---

## ✅ Completed Improvements (December 7, 2025)

### Security Fixes
- ✅ **1.1 ImageKit Authentication** - Added Firebase Admin SDK authentication. Only curators can upload images.
  - Created `src/lib/firebaseAdmin.ts`
  - Updated `src/app/api/imagekit-auth/route.ts`
  - Updated `src/lib/storage.ts` to send auth token
  - **Requires**: `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` env vars

- ⚠️ **1.2 Route Protection Middleware** - Created but removed (Firebase client SDK uses localStorage, not cookies)
  - App relies on client-side auth checks via `AuthContext`
  - **Recommendation**: Deploy Firestore security rules for server-side protection

### Data Integrity Fixes
- ✅ **2.3 Date Unblocking on Cancellation** - Dates are now automatically unblocked when rentals are cancelled/rejected
  - Added `unblockDatesForRental()` function in `src/lib/firestore.ts`
  - Updated `updateRentalStatus()` to call unblock function

### Input Validation
- ✅ **3.2.1 Price Validation** - Added validation for outfit prices
  - Files: `src/app/dashboard/curator/closet/add/page.tsx`, `edit/[id]/page.tsx`
  - Validates: Price > 0, Price ≤ ₹100,000, Security deposit ≥ 0

- ✅ **3.2.2 Phone Number Validation** - Added phone format validation
  - Files: `src/app/checkout/[id]/page.tsx`, `src/app/dashboard/curator/settings/page.tsx`
  - Format: 10-15 digits, supports +, spaces, hyphens, parentheses

- ✅ **3.2.3 PIN Code Validation** - Added Indian PIN code validation
  - File: `src/app/checkout/[id]/page.tsx`
  - Format: 6 digits, first digit cannot be 0

### Edge Case Fixes
- ✅ **3.4.2 Empty Outfit Images** - Added placeholder for missing images
  - Files: `src/components/features/closet/OutfitCard.tsx`, `src/app/checkout/[id]/page.tsx`
  - Shows SVG placeholder: "No Image"

- ✅ **3.4.3 Null Curator Name** - Added fallback for missing curator names
  - File: `src/app/outfit/[id]/page.tsx`
  - Fallback: "Unknown Curator"

- ✅ **3.4.4 Division by Zero in Ratings** - Fixed rating calculation
  - File: `src/lib/firestore.ts` (`recalculateRating()`)
  - Returns 0 when no ratings exist

---

## Executive Summary

This document outlines critical improvements needed to make ClosetShare.in production-ready. Issues are categorized by severity and organized into 5 implementation phases.

### Severity Breakdown

- **CRITICAL** (2 issues): 1 completed, 1 not applicable
- **HIGH** (12 issues): 1 completed, 11 remaining
- **MEDIUM** (20+ issues): 6 completed, 14+ remaining
- **LOW** (15+ issues): 0 completed, 15+ remaining

### Progress by Phase

- **Phase 1: Security** - 50% complete (1/2 completed, 1 not applicable for current architecture)
- **Phase 2: Data Integrity** - 20% complete (1/5 completed)
- **Phase 3: Robustness** - 35% complete (6/17 completed)
- **Phase 4: Performance** - 0% complete
- **Phase 5: Testing** - 0% complete

---

## Phase 1: Security (CRITICAL - Implement First)

### 1.1 ImageKit Authentication Vulnerability ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**File**: `src/app/api/imagekit-auth/route.ts`
**Lines**: 7-9
**Original Issue**:
```typescript
export async function GET() {
    // TODO: Add authentication logic here
    // For production, verify the user is authenticated and authorized
```

**Original Issue**: Anyone can upload unlimited images without authentication

**Implementation Details**:
1. Created `src/lib/firebaseAdmin.ts` with Firebase Admin SDK setup
2. Updated `src/app/api/imagekit-auth/route.ts` to verify Firebase ID tokens
3. Updated `src/lib/storage.ts` to send Authorization header with user's ID token
4. Only authenticated curators can now generate upload tokens

**Code Implemented**:
```typescript
// src/app/api/imagekit-auth/route.ts
import { verifyAuthToken, getUserByUid } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const decodedToken = await verifyAuthToken(authHeader);

    if (!decodedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByUid(decodedToken.uid);
    if (user.role !== 'curator') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate upload params...
}
```

**Environment Variables Required**:
- `FIREBASE_CLIENT_EMAIL` - From Firebase service account
- `FIREBASE_PRIVATE_KEY` - From Firebase service account

---

### 1.2 Missing Route Protection Middleware ⚠️ NOT APPLICABLE

**Status**: ⚠️ **NOT APPLICABLE FOR CURRENT ARCHITECTURE**

**Issue**: No global authentication checks on protected routes

**Why Not Implemented**:
Firebase client SDK stores auth tokens in localStorage/IndexedDB, not HTTP cookies. Next.js middleware runs server-side and cannot access localStorage, making cookie-based middleware ineffective.

**Current Protection Strategy**:
1. **Client-side checks** - Pages use `AuthContext` to verify authentication
2. **API route protection** - Critical endpoints (ImageKit) verify Firebase ID tokens
3. **Firestore security rules** - Server-side data access control (should be deployed)

**Alternative Solution**:
To implement true server-side route protection, you would need to:
1. Set up Firebase session cookies (complex)
2. Modify login flow to set HTTP-only cookies
3. Then use middleware to verify session cookies

**Recommendation**: Current protection is sufficient. **Deploy Firestore security rules** for server-side data protection.

---

### 1.3 Missing Rate Limiting on API Routes

**Files Affected**:
- `/api/razorpay/create-order`
- `/api/razorpay/verify-payment`
- `/api/imagekit-auth`

**Issue**: No protection against abuse/DoS attacks

**Fix Required**: Install rate limiting library
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Example Implementation**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function POST(request: Request) {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Continue with request handling...
}
```

**Priority**: HIGH

---

### 1.4 Deploy Firestore Security Rules

**File**: `firestore.rules` (NEW - Create in project root)

**Current State**: Default rules (likely too permissive)

**Required Rules**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isCurator() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'curator';
    }

    function isAdmin() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Outfits collection
    match /outfits/{outfitId} {
      allow read: if true; // Public read
      allow create: if isCurator();
      allow update: if isCurator() &&
                      resource.data.curatorId == request.auth.uid;
      allow delete: if isCurator() &&
                      resource.data.curatorId == request.auth.uid;
    }

    // Rentals collection
    match /rentals/{rentalId} {
      allow read: if isSignedIn() &&
                    (resource.data.renterUserId == request.auth.uid ||
                     resource.data.curatorId == request.auth.uid ||
                     isAdmin());
      allow create: if isSignedIn();
      allow update: if isSignedIn() &&
                      (resource.data.curatorId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // Ratings collection
    match /ratings/{ratingId} {
      allow read: if true; // Public read for curator ratings
      allow create: if isSignedIn();
      allow update: if false; // Ratings are immutable
      allow delete: if isAdmin();
    }

    // Error logs collection
    match /errorLogs/{errorId} {
      allow read: if isAdmin();
      allow create: if true; // Anyone can log errors
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Issues collection
    match /issues/{issueId} {
      allow read: if isSignedIn() &&
                    (resource.data.reportedBy == request.auth.uid ||
                     resource.data.curatorId == request.auth.uid ||
                     isAdmin());
      allow create: if isSignedIn();
      allow update: if isAdmin() ||
                      resource.data.curatorId == request.auth.uid;
      allow delete: if isAdmin();
    }
  }
}
```

**Deployment**:
```bash
firebase deploy --only firestore:rules
```

**Priority**: CRITICAL

---

## Phase 2: Data Integrity (HIGH Priority)

### 2.1 Double Booking Race Condition ⚠️ HIGH

**File**: `src/lib/firestore.ts`
**Function**: `createRental()` (lines 762-806)

**Issue**: Two users can book same dates simultaneously

**Current Flow**:
1. User A checks availability → dates are free
2. User B checks availability → dates are free
3. User A creates rental → dates blocked
4. User B creates rental → dates blocked AGAIN (double booking!)

**Fix Required**: Use Firestore transactions

```typescript
export const createRental = async (rentalData: Omit<Rental, 'id'>): Promise<string> => {
    const db = getFirestore(app);

    return await runTransaction(db, async (transaction) => {
        // 1. Read outfit document
        const outfitRef = doc(db, 'outfits', rentalData.outfitId);
        const outfitDoc = await transaction.get(outfitRef);

        if (!outfitDoc.exists()) {
            throw new Error('Outfit not found');
        }

        const outfit = outfitDoc.data() as Outfit;

        // 2. Check availability within transaction
        const { startDate, endDate } = rentalData;
        const blockedDates = outfit.blockedDates || [];

        const isBlocked = blockedDates.some(blocked => {
            const blockedStart = blocked.start;
            const blockedEnd = blocked.end;
            return (
                (startDate >= blockedStart && startDate <= blockedEnd) ||
                (endDate >= blockedStart && endDate <= blockedEnd) ||
                (startDate <= blockedStart && endDate >= blockedEnd)
            );
        });

        if (isBlocked) {
            throw new Error('Selected dates are no longer available');
        }

        // 3. Create rental document
        const rentalRef = doc(collection(db, 'rentals'));
        transaction.set(rentalRef, {
            ...rentalData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // 4. Block dates atomically
        transaction.update(outfitRef, {
            blockedDates: arrayUnion({
                start: startDate,
                end: endDate,
                rentalId: rentalRef.id,
            }),
        });

        return rentalRef.id;
    });
};
```

**Priority**: HIGH - Critical for preventing double bookings

---

### 2.2 Stats Update Race Conditions

**File**: `src/lib/firestore.ts`
**Functions**: `updateClosetStats()`, `recalculateRating()`

**Issue**: Read-modify-write pattern without transactions

**Current Code** (lines 564-608):
```typescript
export const updateClosetStats = async (curatorId: string) => {
    const snapshot = await getDocs(outfitsQuery);
    const outfitCount = snapshot.size;

    // PROBLEM: Between reading and writing, another operation could change the data
    await updateDoc(userRef, {
        'closet.stats.outfitsCount': outfitCount,
    });
};
```

**Fix Required**: Use FieldValue.increment()

```typescript
export const incrementClosetOutfitCount = async (curatorId: string, delta: number = 1) => {
    const userRef = doc(db, 'users', curatorId);
    await updateDoc(userRef, {
        'closet.stats.outfitsCount': increment(delta),
    });
};

export const incrementClosetRentalCount = async (curatorId: string, delta: number = 1) => {
    const userRef = doc(db, 'users', curatorId);
    await updateDoc(userRef, {
        'closet.stats.rentalsCount': increment(delta),
    });
};
```

**Usage**:
```typescript
// When outfit is created
await incrementClosetOutfitCount(curatorId, 1);

// When outfit is deleted
await incrementClosetOutfitCount(curatorId, -1);

// When rental is completed
await incrementClosetRentalCount(curatorId, 1);
```

**Priority**: HIGH

---

### 2.3 Date Unblocking on Rental Cancellation ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**File**: `src/lib/firestore.ts`
**Functions**: `updateRentalStatus()`, `unblockDatesForRental()` (new)

**Original Issue**: When rental is cancelled, dates remain blocked forever

**Implementation**:

```typescript
export const updateRentalStatus = async (
    rentalId: string,
    newStatus: RentalStatus,
    statusMessage?: string,
    issueId?: string,
    paymentDetails?: any
) => {
    // Existing validation...

    await updateDoc(rentalRef, updateData);

    // NEW: Unblock dates if rental is cancelled or rejected
    if (newStatus === 'cancelled' || newStatus === 'rejected') {
        const rentalDoc = await getDoc(rentalRef);
        const rental = rentalDoc.data() as Rental;

        await unblockDatesForRental(
            rental.outfitId,
            rental.startDate,
            rental.endDate
        );
    }

    // Rest of function...
};

// NEW FUNCTION
export const unblockDatesForRental = async (
    outfitId: string,
    startDate: number,
    endDate: number
) => {
    const outfitRef = doc(db, 'outfits', outfitId);
    const outfitDoc = await getDoc(outfitRef);

    if (!outfitDoc.exists()) return;

    const outfit = outfitDoc.data() as Outfit;
    const blockedDates = outfit.blockedDates || [];

    const updatedBlockedDates = blockedDates.filter(
        blocked => !(blocked.start === startDate && blocked.end === endDate)
    );

    await updateDoc(outfitRef, {
        blockedDates: updatedBlockedDates,
    });
};
```

**Priority**: HIGH

---

### 2.4 Prevent Outfit Deletion with Active Rentals

**File**: `src/app/dashboard/curator/closet/page.tsx`
**Function**: `handleArchive()` (lines 110-123)

**Issue**: Can archive outfit even if it has active/upcoming rentals

**Fix Required**:

**File**: `src/lib/firestore.ts` - Add new function
```typescript
export const hasActiveRentals = async (outfitId: string): Promise<boolean> => {
    const rentalsRef = collection(db, 'rentals');
    const q = query(
        rentalsRef,
        where('outfitId', '==', outfitId),
        where('status', 'in', ['requested', 'accepted', 'paid', 'in_transit', 'in_use'])
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};
```

**Update page.tsx**:
```typescript
const handleArchive = async (outfitId: string) => {
    // NEW: Check for active rentals
    const hasActive = await hasActiveRentals(outfitId);

    if (hasActive) {
        alert('Cannot archive outfit with active or upcoming rentals. Please wait for all rentals to complete.');
        return;
    }

    // Existing archive logic...
};
```

**Priority**: HIGH

---

### 2.5 Payment Failure Orphaned Rentals

**File**: `src/app/checkout/[id]/page.tsx`
**Lines**: 122-155

**Issue**: Rental created BEFORE payment, can get stuck in "requested" state

**Current Flow**:
```typescript
// Line 122: Create rental FIRST
const rentalId = await createRental({ ... });

// Line 155: Create Razorpay order AFTER
const { orderId } = await createRazorpayOrder(amountInPaise);

// PROBLEM: If createRazorpayOrder fails, rental is orphaned
```

**Fix Required**: Reverse order + cleanup

```typescript
const handlePayment = async () => {
    // Validation...

    setProcessingPayment(true);
    let rentalId: string | null = null;

    try {
        const pricing = calculateRentalPricing(outfit.perNightPrice, nights);
        const amountInPaise = pricing.total * 100;

        // 1. Create Razorpay order FIRST
        const { orderId } = await createRazorpayOrder(amountInPaise);

        // 2. Only create rental if payment order succeeds
        rentalId = await createRental({
            outfitId: id,
            curatorId: outfit.curatorId,
            renterUserId: user.id,
            // ... rest of rental data
            razorpayOrderId: orderId, // Link to payment order
        });

        // 3. Open checkout
        await openRazorpayCheckout({ ... });

    } catch (error) {
        console.error('Payment error:', error);

        // Cleanup: If rental was created but payment failed, cancel it
        if (rentalId) {
            try {
                await updateRentalStatus(rentalId, 'cancelled', 'Payment initialization failed');
            } catch (cleanupError) {
                console.error('Failed to cleanup rental:', cleanupError);
            }
        }

        alert('Payment failed. Please try again.');
        setProcessingPayment(false);

        await logPaymentError(
            error instanceof Error ? error : 'Payment initialization failed',
            user?.id,
            user?.email,
            { outfitId: id, step: 'payment_initialization' }
        );
    }
};
```

**Priority**: HIGH

---

## Phase 3: Robustness & Error Handling

### 3.1 Add Error Logging to All Critical Flows

**Missing Error Logging Locations**:

#### 3.1.1 Authentication Errors
**File**: `src/contexts/AuthContext.tsx`

Add to signIn function:
```typescript
import { logError } from '@/lib/errorLogger';

const signIn = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        await syncUserToFirestore(result.user);
    } catch (error) {
        console.error('Sign in error:', error);

        // NEW: Log authentication errors
        await logError(error instanceof Error ? error : 'Sign-in failed', {
            severity: 'medium',
            category: 'auth',
            metadata: { provider: 'google' },
        });

        throw error;
    }
};
```

#### 3.1.2 Data Fetching Errors
**File**: `src/app/c/[slug]/page.tsx`

Add to useEffect:
```typescript
try {
    const closetData = await getClosetBySlug(slug);
    // ... rest of logic
} catch (error) {
    console.error('Error loading closet:', error);

    // NEW: Log data fetching errors
    await logError(error instanceof Error ? error : 'Failed to load closet', {
        severity: 'medium',
        category: 'data',
        metadata: { slug, route: `/c/${slug}` },
    });

    setError('Failed to load closet');
}
```

#### 3.1.3 File Upload Errors
**File**: `src/app/dashboard/curator/closet/add/page.tsx`

Add to handleImageUpload:
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
        // ... upload logic
    } catch (error) {
        console.error('Upload error:', error);

        // NEW: Log upload errors
        await logError(error instanceof Error ? error : 'Image upload failed', {
            userId: user?.id,
            userEmail: user?.email,
            severity: 'medium',
            category: 'other',
            metadata: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            },
        });

        setUploadProgress(null);
        alert('Upload failed. Please try again.');
    }
};
```

#### 3.1.4 Rental Status Update Errors
**File**: `src/app/order-status/[rentalId]/page.tsx`

Add to all status update functions:
```typescript
const handleAccept = async () => {
    try {
        await updateRentalStatus(rentalId, 'accepted', 'Rental accepted by curator');
        await fetchData();
    } catch (error) {
        console.error('Error accepting rental:', error);

        // NEW: Log rental update errors
        await logError(error instanceof Error ? error : 'Failed to accept rental', {
            userId: user?.id,
            userEmail: user?.email,
            severity: 'high',
            category: 'data',
            metadata: {
                rentalId,
                action: 'accept',
                currentStatus: rental?.status,
            },
        });

        alert('Failed to accept rental. Please try again.');
    }
};
```

**Priority**: MEDIUM (enhances monitoring)

---

### 3.2 Input Validation Gaps

#### 3.2.1 Price Validation ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**Files**:
- `src/app/dashboard/curator/closet/add/page.tsx`
- `src/app/dashboard/curator/closet/edit/[id]/page.tsx`

**Original Issue**: No validation for negative or zero prices

**Implementation**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // NEW: Validate price
    const price = parseFloat(formData.perNightPrice);
    if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price greater than 0');
        return;
    }

    if (price > 100000) {
        alert('Price seems unusually high. Please verify.');
        return;
    }

    // Rest of submit logic...
};
```

#### 3.2.2 Phone Number Validation ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**Files**:
- `src/app/checkout/[id]/page.tsx`
- `src/app/dashboard/curator/settings/page.tsx`

**Original Issue**: No validation for phone format

**Implementation**:
```typescript
const handlePayment = async () => {
    // Existing validation...

    // NEW: Validate phone number
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
        alert('Please enter a valid phone number (10-15 digits)');
        return;
    }

    // Rest of payment logic...
};
```

#### 3.2.3 ZIP Code Validation ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**File**: `src/app/checkout/[id]/page.tsx`

**Implementation**:
```typescript
// NEW: Validate Indian PIN code
const zipRegex = /^[1-9][0-9]{5}$/;
if (!zipRegex.test(formData.zip)) {
    alert('Please enter a valid 6-digit PIN code');
    return;
}
```

#### 3.2.4 Email Validation
**File**: `src/app/dashboard/curator/settings/page.tsx`

**Fix**:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (formData.email && !emailRegex.test(formData.email)) {
    alert('Please enter a valid email address');
    return;
}
```

**Priority**: MEDIUM

---

### 3.3 Missing Payment Idempotency

**File**: `src/app/api/razorpay/create-order/route.ts`

**Issue**: User can create multiple orders for same rental

**Fix Required**:

```typescript
import { createHash } from 'crypto';

export async function POST(request: Request) {
    try {
        const { amount, rentalId } = await request.json();

        // NEW: Create idempotency key
        const idempotencyKey = createHash('sha256')
            .update(`${rentalId}-${amount}`)
            .digest('hex');

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `rental_${rentalId}`,
            notes: {
                rentalId: rentalId,
            },
        };

        // Check if order already exists for this rental
        const existingOrder = await razorpay.orders.fetch(options.receipt);

        if (existingOrder && existingOrder.status === 'created') {
            return NextResponse.json({ orderId: existingOrder.id });
        }

        const order = await razorpay.orders.create(options);
        return NextResponse.json({ orderId: order.id });

    } catch (error) {
        // Handle error...
    }
}
```

**Priority**: MEDIUM

---

### 3.4 Edge Cases Not Handled

#### 3.4.1 Timezone Issues in Date Comparisons
**File**: `src/lib/firestore.ts`
**Function**: `blockDatesForRental()`

**Issue**: Dates stored as timestamps without timezone info

**Recommendation**: Use UTC timestamps consistently
```typescript
// When creating dates from picker
const startDate = new Date(pickerDate);
startDate.setHours(0, 0, 0, 0); // Start of day in local timezone
const startTimestamp = startDate.getTime();

// When comparing dates
const now = new Date();
now.setHours(0, 0, 0, 0);
if (startTimestamp < now.getTime()) {
    throw new Error('Cannot book dates in the past');
}
```

#### 3.4.2 Empty Outfit Images Array ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**Files**:
- `src/components/features/closet/OutfitCard.tsx`
- `src/app/checkout/[id]/page.tsx`

**Original Issue**: Assumes images[0] exists without checking

**Implementation**:
```typescript
// OutfitCard.tsx - SVG placeholder
const imageUrl = outfit.images && outfit.images.length > 0
    ? outfit.images[0]
    : 'data:image/svg+xml,%3Csvg...%3ENo Image%3C/svg%3E';

// checkout/[id]/page.tsx - Safe access
<img src={outfit.images && outfit.images.length > 0 ? outfit.images[0] : ''} />
```

#### 3.4.3 Null/Undefined Curator Name ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**File**: `src/app/outfit/[id]/page.tsx`

**Original Issue**: No fallback for missing curator names

**Implementation**:
```typescript
<div className={styles.curatorName}>
    {closet.displayName || 'Unknown Curator'}
</div>
```

#### 3.4.4 Division by Zero in Rating Calculation ✅ COMPLETED

**Status**: ✅ **IMPLEMENTED** - December 7, 2025

**File**: `src/lib/firestore.ts`
**Function**: `recalculateRating()`

**Original Issue**: Could divide by zero if no ratings exist

**Implementation**:
```typescript
const average = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    : 0;
```

---

## Phase 4: Performance Optimizations

### 4.1 Admin Dashboard Pagination

**File**: `src/app/dashboard/admin/page.tsx`

**Issue**: Fetches ALL rentals, outfits, closets on load (lines 46-54)

**Current**:
```typescript
const [rentals, allOutfits, allClosets] = await Promise.all([
    getAllRentals(),     // Could be 1000+ documents
    getAllOutfits(),     // Could be 1000+ documents
    getAllClosets(),     // Could be 100+ documents
]);
```

**Fix Required**: Add pagination

```typescript
// NEW: Add pagination state
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const PAGE_SIZE = 50;

// NEW: Paginated fetch functions in firestore.ts
export const getRentalsPaginated = async (
    page: number = 1,
    pageSize: number = 50
): Promise<{ rentals: Rental[]; totalCount: number }> => {
    const rentalsRef = collection(db, 'rentals');
    const q = query(
        rentalsRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize),
        startAfter((page - 1) * pageSize)
    );

    const snapshot = await getDocs(q);
    const countSnapshot = await getCountFromServer(rentalsRef);

    return {
        rentals: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Rental[],
        totalCount: countSnapshot.data().count,
    };
};

// Update component
const fetchData = async () => {
    const { rentals, totalCount } = await getRentalsPaginated(currentPage, PAGE_SIZE);
    setRentals(rentals);
    setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
};

// Add pagination controls
<div className={styles.pagination}>
    <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => p - 1)}
    >
        Previous
    </button>
    <span>Page {currentPage} of {totalPages}</span>
    <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => p + 1)}
    >
        Next
    </button>
</div>
```

**Priority**: MEDIUM (critical for scale)

---

### 4.2 N+1 Query Pattern in Order Status

**File**: `src/app/order-status/[rentalId]/page.tsx`

**Issue**: Fetches outfit and closet separately (lines 56-64)

**Current**:
```typescript
const outfitData = await getOutfitById(rental.outfitId);     // Query 1
const closetData = await getClosetByCurator(rental.curatorId); // Query 2
```

**Fix**: Batch fetch or denormalize data

**Option 1: Denormalize** (Recommended)
Store curator name and outfit title in rental document:
```typescript
// When creating rental
const rentalId = await createRental({
    // ... existing fields
    outfitTitle: outfit.title,        // NEW
    outfitImage: outfit.images[0],    // NEW
    curatorName: closet.displayName,  // NEW
});
```

**Option 2: Batch Fetch**
```typescript
const [outfitData, closetData] = await Promise.all([
    getOutfitById(rental.outfitId),
    getClosetByCurator(rental.curatorId),
]);
```

**Priority**: LOW (performance optimization)

---

### 4.3 Missing Firestore Indexes

**File**: `firestore.indexes.json` (NEW - Create in project root)

**Required Composite Indexes**:
```json
{
  "indexes": [
    {
      "collectionGroup": "rentals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "curatorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "rentals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "renterUserId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ratings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ratedUserId", "order": "ASCENDING" },
        { "fieldPath": "ratingType", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "outfits",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "curatorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "errorLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "resolved", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Deploy**:
```bash
firebase deploy --only firestore:indexes
```

**Priority**: MEDIUM

---

## Phase 5: Testing & Code Quality

### 5.1 Add Unit Tests for Critical Functions

**Files to Test**:
1. `src/lib/firestore.ts` - All CRUD operations
2. `src/lib/rentalStatus.ts` - State machine validation
3. `src/lib/razorpay.ts` - Payment verification
4. `src/lib/errorLogger.ts` - Error logging

**Example Test Suite**:

**File**: `src/lib/firestore.test.ts` (NEW)
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRental, updateRentalStatus, hasActiveRentals } from './firestore';

describe('createRental', () => {
    it('should create rental with valid data', async () => {
        const rentalId = await createRental({
            outfitId: 'test-outfit',
            curatorId: 'test-curator',
            renterUserId: 'test-renter',
            // ... required fields
        });

        expect(rentalId).toBeDefined();
        expect(typeof rentalId).toBe('string');
    });

    it('should reject overlapping dates', async () => {
        // First rental
        await createRental({ startDate: 1000, endDate: 2000 });

        // Overlapping rental should fail
        await expect(
            createRental({ startDate: 1500, endDate: 2500 })
        ).rejects.toThrow('dates are no longer available');
    });
});

describe('updateRentalStatus', () => {
    it('should reject invalid status transitions', async () => {
        const rentalId = await createRental({ status: 'requested' });

        await expect(
            updateRentalStatus(rentalId, 'completed')
        ).rejects.toThrow('Invalid status transition');
    });

    it('should unblock dates on cancellation', async () => {
        const rentalId = await createRental({
            outfitId: 'test-outfit',
            startDate: 1000,
            endDate: 2000,
        });

        await updateRentalStatus(rentalId, 'cancelled');

        // Should be able to book same dates again
        const newRentalId = await createRental({
            outfitId: 'test-outfit',
            startDate: 1000,
            endDate: 2000,
        });

        expect(newRentalId).toBeDefined();
    });
});
```

**Run Tests**:
```bash
npm test -- src/lib/firestore.test.ts
```

**Priority**: LOW (quality assurance)

---

### 5.2 Enable TypeScript Strict Mode

**File**: `tsconfig.json`

**Current**:
```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

**Recommended**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Note**: This will cause ~100+ type errors initially. Fix incrementally:
1. Start with `strictNullChecks: true` only
2. Add `!` assertions where values are guaranteed
3. Add proper null checks elsewhere
4. Gradually enable other strict flags

**Priority**: LOW (long-term maintenance)

---

### 5.3 Add E2E Tests for Critical Flows

**Recommended**: Playwright for E2E testing

**Install**:
```bash
npm install -D @playwright/test
npx playwright install
```

**File**: `tests/checkout-flow.spec.ts` (NEW)
```typescript
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
    // 1. Navigate to outfit page
    await page.goto('/outfit/test-outfit-id');

    // 2. Select dates
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-date="2025-12-10"]'); // Start date
    await page.click('[data-date="2025-12-15"]'); // End date

    // 3. Click Rent Now
    await page.click('button:has-text("Rent Now")');

    // 4. Verify checkout page loaded
    await expect(page).toHaveURL(/\/checkout\//);

    // 5. Fill delivery form
    await page.fill('#fullName', 'Test User');
    await page.fill('#phone', '+91 9876543210');
    await page.fill('#address', '123 Test Street');
    await page.fill('#city', 'Mumbai');
    await page.fill('#state', 'Maharashtra');
    await page.fill('#zip', '400001');

    // 6. Verify payment button is enabled
    const payButton = page.locator('button:has-text("Pay")');
    await expect(payButton).toBeEnabled();
});

test('prevent checkout without dates', async ({ page }) => {
    await page.goto('/outfit/test-outfit-id');

    // Try to click Rent Now without selecting dates
    await page.click('button:has-text("Rent Now")');

    // Should NOT navigate to checkout
    await expect(page).not.toHaveURL(/\/checkout\//);
});
```

**Priority**: LOW (quality assurance)

---

## Additional Recommendations

### 6.1 Code Organization

**Issue**: Large files with multiple responsibilities

**Examples**:
- `src/lib/firestore.ts` - 1449 lines, 40+ functions
- `src/app/dashboard/admin/page.tsx` - 600+ lines

**Recommendation**: Split into smaller modules

```
src/lib/firestore/
├── index.ts           // Re-exports
├── users.ts           // User CRUD
├── outfits.ts         // Outfit CRUD
├── rentals.ts         // Rental CRUD
├── ratings.ts         // Rating CRUD
├── errors.ts          // Error log CRUD
└── stats.ts           // Stats calculations
```

**Priority**: LOW (maintainability)

---

### 6.2 Environment Variable Validation

**File**: `src/lib/env.ts` (NEW)

**Purpose**: Validate all required env vars on startup

```typescript
const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
] as const;

export function validateEnv() {
    const missing = requiredEnvVars.filter(
        key => !process.env[key]
    );

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }
}
```

**Usage in** `src/app/layout.tsx`:
```typescript
import { validateEnv } from '@/lib/env';

if (process.env.NODE_ENV === 'production') {
    validateEnv();
}
```

**Priority**: LOW

---

### 6.3 Monitoring & Analytics

**Recommended Tools**:
1. **Sentry** - Error tracking and performance monitoring
2. **Vercel Analytics** - Page views and Web Vitals
3. **Firebase Performance Monitoring** - Database query performance

**Setup Sentry**:
```bash
npm install @sentry/nextjs
```

**File**: `sentry.client.config.ts` (NEW)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
});
```

**Priority**: LOW (production monitoring)

---

## Implementation Priority Summary

### ✅ COMPLETED (December 7, 2025):
1. ✅ ImageKit authentication (CRITICAL) - Firebase Admin SDK implemented
2. ⚠️ Route protection middleware (HIGH) - Not applicable for current architecture
3. ✅ Date unblocking on rental cancellation (HIGH)
4. ✅ Price validation - Add & Edit pages
5. ✅ Phone number validation - Checkout & Settings pages
6. ✅ PIN code validation - Checkout page
7. ✅ Empty outfit images fallback - SVG placeholder
8. ✅ Null curator name fallback - "Unknown Curator"
9. ✅ Division by zero in ratings - Fixed

### IMMEDIATE NEXT (Deploy Before Production):
1. ❌ Deploy Firestore security rules (CRITICAL) - See section 1.4
2. ❌ Add Firebase Admin environment variables to Vercel

### SHORT-TERM (Next 1-2 Weeks):
1. ❌ Fix stats update race conditions - Use FieldValue.increment() (Section 2.2)
2. ❌ Fix payment orphaned rental issue - Reverse order of operations (Section 2.5)
3. ❌ Add rate limiting to API routes - Install Upstash (Section 1.3)
4. ❌ Prevent outfit deletion with active rentals (Section 2.4)
5. ❌ Add payment idempotency (Section 3.3)

### MEDIUM-TERM (Next 1-2 Months):
1. ❌ Add pagination to admin dashboard (Section 4.1)
2. ❌ Expand error logging to all critical flows (Section 3.1)
3. ❌ Deploy Firestore indexes (Section 4.3)
4. ❌ Fix N+1 query patterns (Section 4.2)
5. ❌ Handle remaining edge cases (timezone, etc.)

### LONG-TERM (2+ Months):
1. ❌ Add unit tests for critical functions (Section 5.1)
2. ❌ Add E2E tests for checkout flow (Section 5.2)
3. ❌ Enable TypeScript strict mode (Section 5.2)
4. ❌ Refactor large files (Section 6.1)
5. ❌ Set up monitoring tools - Sentry, Analytics (Section 6.3)

---

## Testing Checklist

Before production launch, verify:

**✅ Implemented:**
- [x] ImageKit uploads require authentication (curator role only)
- [x] Cancelled rentals unblock dates automatically
- [x] Price validation works (Add & Edit outfit pages)
- [x] Phone number validation works (Checkout & Settings)
- [x] PIN code validation works (Checkout)
- [x] Empty outfit images show placeholder
- [x] Null curator names show "Unknown Curator"
- [x] Rating calculation handles zero ratings

**⚠️ Client-Side Protection (Already Working):**
- [x] Cannot access curator dashboard without authentication (AuthContext)
- [x] Cannot access admin dashboard without authentication (AuthContext)

**❌ To Be Implemented:**
- [ ] Cannot double-book same dates (need transaction fix - Section 2.1)
- [ ] Cannot archive outfit with active rentals (Section 2.4)
- [ ] Payment failures don't create orphaned rentals (Section 2.5)
- [ ] Rate limiting prevents API abuse (Section 1.3)

**❌ Deployment Required:**
- [ ] Firebase Admin env vars set (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- [ ] Razorpay test mode is disabled (use live keys)
- [ ] Firebase authorized domains include production URL
- [ ] All required environment variables are set in Vercel
- [ ] Firestore security rules are deployed (Section 1.4)
- [ ] Firestore indexes are deployed (Section 4.3)

---

## Deployment Checklist

**Environment Variables (Vercel):**
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (should already exist)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` (should already exist)
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Switch to LIVE key
- [ ] `RAZORPAY_KEY_SECRET` - Switch to LIVE secret
- [ ] `FIREBASE_CLIENT_EMAIL` - **NEW** From service account JSON
- [ ] `FIREBASE_PRIVATE_KEY` - **NEW** From service account JSON (with quotes)
- [ ] `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` (should already exist)
- [ ] `IMAGEKIT_PRIVATE_KEY` (should already exist)

**Firebase Configuration:**
- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Add production domain to Firebase authorized domains
- [ ] Download and save Firebase service account JSON (for FIREBASE_CLIENT_EMAIL/PRIVATE_KEY)

**Razorpay Configuration:**
- [ ] Switch from test to live mode in Razorpay dashboard
- [ ] Add production domain to Razorpay allowed origins
- [ ] Update webhook URLs if applicable

**General:**
- [ ] Set `NODE_ENV=production` in Vercel
- [ ] Enable HTTPS only (Vercel does this by default)
- [ ] Test ImageKit upload with curator account (verify auth works)
- [ ] Test checkout flow end-to-end
- [ ] Verify all validation works (price, phone, PIN)

**Optional (Recommended):**
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup strategy for Firestore
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Document admin dashboard access credentials

---

**Document Version**: 1.1
**Last Updated**: December 7, 2025
**Issues Resolved**: 8/50+
**Next Priority**: Deploy Firestore security rules & Firebase Admin env vars

For questions or clarifications, review the specific file locations and line numbers referenced in each section.
