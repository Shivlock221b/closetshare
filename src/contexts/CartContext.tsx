'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    outfitId: string;
    addedAt: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (outfitId: string) => void;
    removeFromCart: (outfitId: string) => void;
    clearCart: () => void;
    isInCart: (outfitId: string) => boolean;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'closetshare_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
            try {
                setCartItems(JSON.parse(storedCart));
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
            }
        }
        setIsHydrated(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        }
    }, [cartItems, isHydrated]);

    const addToCart = (outfitId: string) => {
        setCartItems(prev => {
            // Don't add duplicates
            if (prev.some(item => item.outfitId === outfitId)) {
                return prev;
            }
            return [...prev, { outfitId, addedAt: Date.now() }];
        });
    };

    const removeFromCart = (outfitId: string) => {
        setCartItems(prev => prev.filter(item => item.outfitId !== outfitId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const isInCart = (outfitId: string) => {
        return cartItems.some(item => item.outfitId === outfitId);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                clearCart,
                isInCart,
                cartCount: cartItems.length,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
