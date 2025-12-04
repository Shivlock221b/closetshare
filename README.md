# ClosetShare.in

A peer-to-peer fashion rental platform where influencers and creators host their closets and rent outfits to followers.

## Features

- **Guest/Follower**: Browse closets, view outfits, and rent.
- **Curator**: Manage closet, accept rentals, and track earnings.
- **Admin**: Full control over the platform.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, CSS Modules.
- **Backend**: Firebase (Auth, Firestore, Storage).
- **Payment**: Razorpay Payment Gateway.
- **Testing**: Vitest (Unit).
- **Styling**: Custom CSS variables (Coral/Cream theme).

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Firebase & Razorpay**:
    Copy `env.example` to `.env.local` and fill in your Firebase project details and Razorpay credentials.
    ```bash
    cp env.example .env.local
    ```
    
    Required environment variables:
    - Firebase: API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID
    - Razorpay: Key ID (public), Key Secret (private)

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Run tests**:
    ```bash
    npm test
    ```

## Project Structure

- `src/app`: Next.js App Router pages.
- `src/components`: Reusable UI and feature components.
- `src/lib`: Utility functions and Firebase config.
- `src/types`: TypeScript definitions for the data model.

## Key Routes

- `/`: Landing Page
- `/c/[slug]`: Public Closet Profile (e.g., `/c/ashley`)
- `/outfit/[id]`: Outfit View Page
- `/checkout/[id]`: Checkout Page
- `/dashboard/curator`: Curator Dashboard
