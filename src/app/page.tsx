import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function Home() {
  return (
    <main>
      <Header />
      <div className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>Rent the look,<br />Share the style.</h1>
          <p className={styles.subtitle}>
            ClosetShare is a peer-to-peer fashion rental platform.
            Rent outfits from your favorite creators or share your own closet.
          </p>

          <div className={styles.actions}>
            <Link href="/c/ashley">
              <Button size="lg">Browse Demo Closet</Button>
            </Link>
            <Link href="/dashboard/curator">
              <Button variant="outline" size="lg">Curator Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.container}>
          <h2 className="text-serif text-center" style={{ fontSize: '2rem', marginBottom: '32px' }}>How it works</h2>
          <div className={styles.grid}>
            <div className={styles.featureCard}>
              <div className={styles.icon}>1</div>
              <h3>Browse</h3>
              <p>Find unique outfits from top curators.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.icon}>2</div>
              <h3>Rent</h3>
              <p>Book for 3-7 days. Secure & easy.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.icon}>3</div>
              <h3>Slay</h3>
              <p>Wear it, love it, return it.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
