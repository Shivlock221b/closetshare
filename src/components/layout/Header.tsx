'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShoppingBag, LogOut, Settings, LayoutDashboard, X, Store } from 'lucide-react';
import styles from './Header.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

const WHATSAPP_SUPPORT = 'https://wa.me/6590574472?text=Hi%2C%20I%20need%20help%20with%20ClosetShare';

export const Header: React.FC = () => {
    const { user, signIn, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMainMenu, setShowMainMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const mainMenuRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        try {
            await signOut();
            setShowUserMenu(false);
            setShowMainMenu(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleSignIn = async () => {
        try {
            await signIn();
        } catch (error) {
            console.error('Error signing in:', error);
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (mainMenuRef.current && !mainMenuRef.current.contains(event.target as Node)) {
                setShowMainMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleContactSupport = () => {
        window.open(WHATSAPP_SUPPORT, '_blank');
        setShowMainMenu(false);
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <Image
                        src="/logo.jpg"
                        alt="ClosetShare"
                        width={40}
                        height={40}
                        className={styles.logoImage}
                    />
                    <span className={styles.logoText}>ClosetShare</span>
                </Link>

                <nav className={styles.nav}>
                    {/* Cart Button */}
                    <Link href="/cart" className={styles.iconBtn}>
                        <ShoppingBag size={24} />
                    </Link>

                    {/* User Menu / Login Button */}
                    {user ? (
                        <div className={styles.userMenu} ref={userMenuRef}>
                            <button
                                className={styles.avatarBtn}
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                <Avatar
                                    src={user.avatarUrl}
                                    name={user.displayName}
                                    size="sm"
                                />
                            </button>

                            {showUserMenu && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <Avatar
                                            src={user.avatarUrl}
                                            name={user.displayName}
                                            size="lg"
                                        />
                                        <div className={styles.userInfo}>
                                            <div className={styles.userName}>{user.displayName}</div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                        </div>
                                    </div>
                                    <div className={styles.dropdownDivider} />
                                    <button className={styles.dropdownItem} onClick={handleSignOut}>
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className={styles.iconBtn} onClick={handleSignIn}>
                            <Avatar name="?" size="sm" />
                        </button>
                    )}

                    {/* Main Menu (Hamburger) */}
                    <div className={styles.mainMenu} ref={mainMenuRef}>
                        <button
                            className={styles.iconBtn}
                            onClick={() => setShowMainMenu(!showMainMenu)}
                        >
                            {showMainMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {showMainMenu && (
                            <div className={styles.dropdown}>
                                {/* <Link
                                    href="/closets"
                                    className={styles.dropdownItem}
                                    onClick={() => setShowMainMenu(false)}
                                >
                                    <Store size={16} />
                                    Browse Closets
                                </Link> */}
                                {user && (
                                    <>
                                        <div className={styles.dropdownDivider} />
                                        <Link
                                            href="/dashboard/curator/settings"
                                            className={styles.dropdownItem}
                                            onClick={() => setShowMainMenu(false)}
                                        >
                                            <Settings size={16} />
                                            Profile Settings
                                        </Link>
                                        <Link
                                            href="/dashboard/curator"
                                            className={styles.dropdownItem}
                                            onClick={() => setShowMainMenu(false)}
                                        >
                                            <LayoutDashboard size={16} />
                                            Dashboard
                                        </Link>
                                        <Link
                                            href="/orders"
                                            className={styles.dropdownItem}
                                            onClick={() => setShowMainMenu(false)}
                                        >
                                            <ShoppingBag size={16} />
                                            My Orders
                                        </Link>
                                        <div className={styles.dropdownDivider} />
                                    </>
                                )}
                                <button className={styles.dropdownItem} onClick={handleContactSupport}>
                                    💬 Contact Support
                                </button>
                                {user && (
                                    <>
                                        <div className={styles.dropdownDivider} />
                                        <button className={styles.dropdownItem} onClick={handleSignOut}>
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
};
