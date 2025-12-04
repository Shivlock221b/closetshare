# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClosetShare.in is a peer-to-peer fashion rental platform where influencers and creators host their closets and rent outfits to followers. The platform supports three user roles: guests/followers (browse and rent), curators (manage closets and earnings), and admins (platform control).

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Payment**: Razorpay Payment Gateway
- **Testing**: Vitest for unit tests
- **Styling**: CSS Modules with custom CSS variables (Coral/Cream theme)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build production bundle
npm build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Environment Configuration

Copy `env.example` to `.env.local` and configure:

**Firebase** (all prefixed with `NEXT_PUBLIC_`):
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

**Razorpay**:
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (public key for client-side)
- `RAZORPAY_KEY_SECRET` (private key for server-side API routes)

## Architecture & Data Flow

### Authentication Flow

The app uses Firebase Auth with Google OAuth. Key components:

1. **Firebase Initialization** (`src/lib/firebase.ts`): Singleton pattern ensures Firebase app is initialized once
2. **Auth Functions** (`src/lib/auth.ts`): Handles sign-in, sign-out, and syncs Firebase Auth users with Firestore user documents
3. **AuthContext** (`src/contexts/AuthContext.tsx`): React Context provides `user`, `loading`, `signIn()`, and `signOut()` throughout the app
4. **User Creation**: On first sign-in, creates a Firestore document at `users/{uid}` with role defaulting to 'user'

The auth system gracefully handles offline scenarios - if Firestore is unavailable, it falls back to Firebase Auth data.

### Firestore Collections

**users**: User profiles with role, displayName, email, avatarUrl, bio, stats, and publicClosetSlug
**outfits**: Outfit listings with curatorId, title, description, images, pricing, sizes, tags, and status
**rentals**: Rental transactions with outfitId, curatorId, renter details, status, dates, delivery address, and pricing breakdown

### Rental Status State Machine

Rentals follow a strict state machine defined in `src/lib/rentalStatus.ts`:

```
requested → accepted → paid → in_transit → in_use → returned → completed
         ↓         ↓      ↓          ↓         ↓
         → rejected
         → cancelled (from most states)
```

Use `isValidStatusTransition(currentStatus, newStatus)` to validate transitions before updating. Invalid transitions throw errors.

### Payment Flow (Razorpay)

1. **Create Order** (`/api/razorpay/create-order`): Server-side creates Razorpay order using secret key
2. **Open Checkout** (`src/lib/razorpay.ts`): Client loads Razorpay SDK and opens checkout modal
3. **Payment Handler**: On success, receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
4. **Verify Payment** (`/api/razorpay/verify-payment`): Server validates signature using HMAC-SHA256
5. **Update Rental**: On verification, update rental status to 'paid' with payment details via `src/lib/firestore.ts`

**Important**: Never expose `RAZORPAY_KEY_SECRET` to the client. Payment verification must happen server-side.

### Route Structure

- `/`: Landing page
- `/c/[slug]`: Public closet profile (dynamic, based on user's `publicClosetSlug`)
- `/outfit/[id]`: Individual outfit detail page
- `/checkout/[id]`: Checkout flow for outfit rental
- `/dashboard/curator`: Curator dashboard for managing closet
- `/dashboard/admin`: Admin dashboard
- `/loggedIn`: Post-login redirect page

All routes under `/dashboard` should check user role via `useAuth()` hook.

### Component Organization

- `src/components/ui/`: Generic reusable UI components (Button, Input)
- `src/components/layout/`: Layout components (Header)
- `src/components/features/`: Feature-specific components organized by domain (e.g., `closet/OutfitCard.tsx`)

### TypeScript Type System

All data models defined in `src/types/index.ts`:

- `User`: Contains `role: UserRole` ('curator' | 'admin' | 'user')
- `Outfit`: Contains `status: OutfitStatus` ('active' | 'archived')
- `Rental`: Contains `status: RentalStatus` (9 possible states)

Use these types consistently. Timestamps are stored as Unix epoch numbers.

### Styling Approach

Uses CSS Modules with custom CSS variables for theming. The design system uses a Coral/Cream palette. Key fonts:
- Sans-serif: Inter (`--font-sans`)
- Serif: Playfair Display (`--font-serif`)

Applied via `className={inter.variable}` in layout.tsx, accessible in CSS as `var(--font-sans)`.

## Testing

Unit tests use Vitest. Test files are co-located with source files using `.test.ts` suffix (e.g., `utils.test.ts`).

Run individual test files:
```bash
npm test -- src/lib/utils.test.ts
```

## Common Patterns

### Accessing Current User
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, loading, signIn, signOut } = useAuth();
```

### Firestore Operations
```typescript
import { createRental, updateRentalStatus, getOutfitById } from '@/lib/firestore';

// Create rental
const rentalId = await createRental({ ...rentalData });

// Update status
await updateRentalStatus(rentalId, 'paid', { razorpayPaymentId, razorpayOrderId, razorpaySignature });
```

### Validating Rental Transitions
```typescript
import { isValidStatusTransition } from '@/lib/rentalStatus';

if (!isValidStatusTransition(currentStatus, newStatus)) {
  // Handle invalid transition
}
```

## Path Aliases

TypeScript configured with `@/*` alias mapping to `src/*`. Always use this alias for imports:
```typescript
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
```
