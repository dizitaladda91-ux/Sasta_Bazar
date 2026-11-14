import React from 'react';
import { useRouter } from 'next/router';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import AnnouncementBar from './components/layout/AnnouncementBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CollectionPage from './pages/CollectionPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AboutPage from './pages/AboutPage';
import ArticlesPage from './pages/ArticlesPage';
import ContactPage from './pages/ContactPage';
import SizeGuidePage from './pages/SizeGuidePage';
import FaqsPage from './pages/FaqsPage';
import CustomizationPage from './pages/CustomizationPage';
import CareInstructionsPage from './pages/CareInstructionsPage';
import TrackOrderPage from './pages/TrackOrderPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AuthPage from './pages/AuthPage';

// Policies
import PrivacyPolicyPage from './pages/policies/PrivacyPolicyPage';
import ShippingPolicyPage from './pages/policies/ShippingPolicyPage';
import RefundPolicyPage from './pages/policies/RefundPolicyPage';
import TermsPage from './pages/policies/TermsPage';
import CookiePolicyPage from './pages/policies/CookiePolicyPage';
import NotFoundPage from './pages/NotFoundPage';

// Floating Toast Notification
function ToastAlert() {
  const { notification: cartNote } = useCart();
  const { notification: wishNote } = useWishlist();
  const { notification: authNote } = useAuth();
  const note = cartNote || wishNote || authNote;

  if (!note) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-sasta-navy text-white text-xs sm:text-sm font-medium py-2.5 px-5 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in border border-sasta-gold/40">
      <span className="w-2 h-2 rounded-full bg-sasta-gold animate-pulse" />
      <span>{note}</span>
    </div>
  );
}

function MainLayout() {
  const router = useRouter();
  const pathname = router.asPath.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const segments = pathname.split('/').filter(Boolean);
  let page = <NotFoundPage />;

  if (pathname === '/') page = <HomePage />;
  else if (pathname === '/shop') page = <ShopPage />;
  else if (segments[0] === 'collection' && segments[1]) page = <CollectionPage />;
  else if (segments[0] === 'product' && segments[1]) page = <ProductDetailPage />;
  else if (pathname === '/cart') page = <CartPage />;
  else if (pathname === '/wishlist') page = <WishlistPage />;
  else if (pathname === '/search') page = <SearchResultsPage />;
  else if (pathname === '/about') page = <AboutPage />;
  else if (pathname === '/articles') page = <ArticlesPage />;
  else if (pathname === '/contact') page = <ContactPage />;
  else if (pathname === '/size-guide') page = <SizeGuidePage />;
  else if (pathname === '/faqs') page = <FaqsPage />;
  else if (pathname === '/customization') page = <CustomizationPage />;
  else if (pathname === '/care-instructions') page = <CareInstructionsPage />;
  else if (pathname === '/track-order') page = <TrackOrderPage />;
  else if (pathname === '/admin') page = <AdminDashboardPage />;
  else if (['/login', '/register', '/account'].includes(pathname)) page = <AuthPage />;
  else if (pathname === '/privacy-policy') page = <PrivacyPolicyPage />;
  else if (pathname === '/shipping-policy') page = <ShippingPolicyPage />;
  else if (pathname === '/refund-policy') page = <RefundPolicyPage />;
  else if (pathname === '/terms-of-service') page = <TermsPage />;
  else if (pathname === '/cookie-policy') page = <CookiePolicyPage />;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        {page}
      </main>
      <Footer />
      <CartDrawer />
      <ToastAlert />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <MainLayout />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
