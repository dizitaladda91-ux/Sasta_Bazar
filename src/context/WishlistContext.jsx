import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProductImageSet } from '../data/imageCatalog';

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = 'sasta_bazaar_wishlist_v1';

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved).map((item) => ({
        ...item,
        image: getProductImageSet(item.handle).primaryImage,
      })) : [];
    } catch (e) {
      console.error('Failed to parse wishlist from localStorage', e);
      return [];
    }
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlistItems]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showNotification(`Removed "${product.title}" from your wishlist`);
        return prev.filter(item => item.id !== product.id);
      } else {
        showNotification(`Saved "${product.title}" to your wishlist`);
        return [
          ...prev,
          {
            id: product.id,
            handle: product.handle,
            title: product.title,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            image: product.primaryImage || (product.images && product.images[0]) || '',
            category: product.category,
            available: product.available,
            currency: '£'
          }
        ];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        notification
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
