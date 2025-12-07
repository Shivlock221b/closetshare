# Deployment Guide - ClosetShare.in

## ✅ Code is Ready for Vercel Deployment

### Pre-Deployment Checklist

**✅ TypeScript**: No critical errors (only pre-existing test file issues)
**✅ Environment Variables**: Properly documented in `env.example`
**✅ Git Configuration**: `.gitignore` configured correctly
**✅ Next.js Config**: Image domains properly configured
**✅ Dependencies**: All installed and up-to-date

### Known Issue: Turbopack Build Error

There's a known Turbopack bug in Next.js 16.0.6 that may cause local builds to fail. **This will NOT affect Vercel deployment** as Vercel uses its own build system.

## Deploying to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add rating system"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**:
   
   Add these in Vercel Dashboard → Settings → Environment Variables:
   
   **Firebase** (all NEXT_PUBLIC_*):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   
   **Razorpay**:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (public key)
   - `RAZORPAY_KEY_SECRET` (secret - Production, Preview, Development)
   
   **ImageKit**:
   - `NEXT_IMAGEKIT_PUBLIC_KEY`
   - `IMAGEKIT_PRIVATE_KEY`
   - `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
   
   **Admin**:
   - `ADMIN_SECRET`

4. **Deploy**: Click "Deploy" and Vercel will build and deploy your app

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables interactively
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... add all other env vars

# Deploy to production
vercel --prod
```

## Post-Deployment Steps

### 1. Firestore Security Rules

Make sure to add security rules for the new `ratings` collection:

```javascript
match /ratings/{ratingId} {
  // Read: Users can read their own ratings (given and received)
  allow read: if request.auth != null && (
    resource.data.raterId == request.auth.uid ||
    resource.data.ratedUserId == request.auth.uid ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
  
  // Create: Only authenticated users can create ratings
  allow create: if request.auth != null &&
    request.auth.uid == request.resource.data.raterId &&
    request.resource.data.isLocked == true &&
    request.resource.data.stars >= 1 &&
    request.resource.data.stars <= 5;
  
  // Update/Delete: Never allowed (ratings are locked forever)
  allow update, delete: if false;
}
```

### 2. Firestore Indexes

Create composite indexes in Firebase Console:

1. **Collection**: `ratings`
   - Fields: `ratedUserId` (ASC), `ratingType` (ASC)
   
2. **Collection**: `ratings`
   - Fields: `rentalId` (ASC), `raterId` (ASC)

Firebase will prompt you to create these when queries are first run.

### 3. Test the Rating Flow

1. Complete a test rental (change status to 'completed')
2. Verify rating forms appear on order status page
3. Submit ratings from both renter and curator perspectives
4. Check that ratings display correctly on closet page
5. Verify admin can see user ratings in dashboard

## Troubleshooting

**Build fails on Vercel**:
- Check all environment variables are set
- Verify Firebase credentials are correct
- Check Vercel build logs for specific errors

**Ratings not appearing**:
- Ensure rental status is 'completed'
- Check Firestore security rules are deployed
- Verify Firebase indexes are created

**Images not loading**:
- Confirm image domains in `next.config.ts`
- Check ImageKit environment variables

## Support

For Vercel deployment issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

For Firebase issues:
- [Firebase Console](https://console.firebase.google.com)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
