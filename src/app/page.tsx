import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function Home() {
  return (
    <main>
      <Header />
      <div className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>Turn your closet<br />into cash.</h1>
          <p className={styles.subtitle}>
            ClosetShare is a peer-to-peer fashion rental platform.
            Rent out your wardrobe or discover unique outfits from curators near you.
          </p>

          <div className={styles.actions}>
            <Link href="/closets">
              <Button size="lg">Browse Closets</Button>
            </Link>
            <Link href="/dashboard/curator">
              <Button variant="outline" size="lg">Become a Curator</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How it works - Curator focused */}
      <div className={styles.features}>
        <div className={styles.container}>
          <h2 className="text-serif text-center" style={{ fontSize: '2rem', marginBottom: '32px' }}>
            Start earning from your closet
          </h2>
          <div className={styles.grid}>
            <div className={styles.featureCard}>
              <div className={styles.icon}>1</div>
              <h3>Create Your Closet</h3>
              <p>Sign up, add your outfits with photos and set your rental prices.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.icon}>2</div>
              <h3>Get Verified</h3>
              <p>We review your closet to ensure quality, then you're live!</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.icon}>3</div>
              <h3>Receive Requests</h3>
              <p>Accept rental requests, ship the outfit, and earn money.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works - Renter section */}
      <div className={styles.features} style={{ background: 'white' }}>
        <div className={styles.container}>
          <h2 className="text-serif text-center" style={{ fontSize: '2rem', marginBottom: '32px' }}>
            How renting works
          </h2>
          <div className={styles.grid}>
            <div className={styles.featureCard}>
              <div className={styles.icon}>1</div>
              <h3>Browse</h3>
              <p>Find unique outfits from verified curators.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.icon}>2</div>
              <h3>Rent</h3>
              <p>Select dates, pay securely. No hidden fees.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.icon}>3</div>
              <h3>Slay & Return</h3>
              <p>Wear it, love it, return it. Security deposit refunded.</p>
            </div>
          </div>
        </div>
      </div>

      {/* No commission callout */}
      <div className={styles.callout}>
        <div className={styles.container}>
          <div className={styles.calloutContent}>
            <Image
              src="/logo.jpg"
              alt="ClosetShare"
              width={60}
              height={60}
              style={{ borderRadius: '12px' }}
            />
            <div>
              <h3>Zero Commission for Curators</h3>
              <p>We don't take any cut from your earnings. You keep 100% of your rental income.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
