import React, { createContext, useContext, useState, useEffect } from 'react';
import { ENV } from '../config/env';

const CartContext = createContext();

const CART_STORAGE_KEY = 'sasta_bazaar_cart_v1';
const FREE_SHIPPING_THRESHOLD = ENV.freeShippingThreshold; // £40 default for free delivery

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const addToCart = (product, selectedSize = null, selectedColor = null, quantity = 1) => {
    const defaultSize = selectedSize || (product.sizes && product.sizes[0]) || 'Free Size';
    const defaultColor = selectedColor || (product.colors && product.colors[0]) || null;
    const itemKey = `${product.id}_${defaultSize}_${defaultColor || ''}`;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.itemKey === itemKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            itemKey,
            id: product.id,
            variantId: product.variants?.find((variant) =>
              (!defaultSize || variant.size === defaultSize) && (!defaultColor || variant.color === defaultColor)
            )?.id,
            handle: product.handle,
            title: product.title,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            image: product.primaryImage || (product.images && product.images[0]) || '',
            size: defaultSize,
            color: defaultColor,
            quantity: quantity,
            currency: '£'
          }
        ];
      }
    });

    setIsCartOpen(true);
    showNotification(`Added "${product.title}" to your bag`);
  };

  const updateQuantity = (itemKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (item.itemKey === itemKey ? { ...item, quantity: newQuantity } : item))
    );
  };

  const removeFromCart = (itemKey) => {
    setCartItems(prev => prev.filter(item => item.itemKey !== itemKey));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalCount,
        freeShippingRemaining,
        freeShippingProgress,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        notification
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
