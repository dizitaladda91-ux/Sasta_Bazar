'use client';

import React, { Suspense } from 'react';
import { AuthProvider } from '../../src/context/AuthContext';
import { CartProvider } from '../../src/context/CartContext';
import { WishlistProvider } from '../../src/context/WishlistContext';
import AnnouncementBar from '../../src/components/layout/AnnouncementBar';
import Header from '../../src/components/layout/Header';
import Footer from '../../src/components/layout/Footer';
import CartDrawer from '../../src/components/layout/CartDrawer';

export default function StorefrontChrome({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="flex min-h-screen flex-col bg-white">
            <AnnouncementBar />
            <Suspense fallback={<div className="h-[76px] sm:h-[84px] bg-[#fcfaf7] border-b border-sasta-border" />}>
              <Header />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
