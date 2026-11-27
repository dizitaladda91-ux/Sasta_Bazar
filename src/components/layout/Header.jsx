import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import MobileNav from './MobileNav';
import SearchModal from './SearchModal';
import MegaMenu from './MegaMenu';

export default function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const collectionMenuRef = useRef(null);
  const closeTimerRef = useRef(null);
  const { totalCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openCollections = () => {
    cancelCloseTimer();
    setIsCollectionsOpen(true);
  };

  const scheduleCloseCollections = () => {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsCollectionsOpen(false);
    }, 180);
  };

  useEffect(() => () => cancelCloseTimer(), []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsSearchOpen(false);
    setIsCollectionsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCollectionsOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!collectionMenuRef.current?.contains(event.target)) setIsCollectionsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsCollectionsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isCollectionsOpen]);

  return (
    <>
      <header
        ref={collectionMenuRef}
        className={`sticky top-0 z-40 bg-[#fcfaf7] text-sasta-heading transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}
      >
        <div className="mx-auto flex h-[76px] max-w-[1780px] items-center justify-between gap-3 px-4 sm:h-[84px] sm:px-7 lg:px-10">
          <div className="flex shrink-0 items-center gap-1 lg:w-[120px]">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="rounded-full p-2 text-sasta-heading transition-colors hover:bg-black/5 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="rounded-full p-2 text-sasta-heading transition-colors hover:bg-black/5 lg:hidden"
              aria-label="Search products"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link to="/" className="hidden lg:block">
              <img src="/logo.png" alt="Sasta Bazaar" className="h-[70px] w-auto max-w-[120px] object-contain mix-blend-multiply" />
            </Link>
          </div>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:hidden">
            <img src="/logo.png" alt="Sasta Bazaar" className="h-[58px] w-auto max-w-[108px] object-contain mix-blend-multiply" />
          </Link>

          <nav className="hidden min-w-0 flex-1 lg:block" aria-label="Main navigation">
            <ul className="flex items-center justify-center gap-5 xl:gap-8">
              <li
                className="relative"
                onMouseEnter={openCollections}
                onMouseLeave={scheduleCloseCollections}
              >
                <button
                  type="button"
                  aria-expanded={isCollectionsOpen}
                  aria-controls="collection-menu"
                  aria-haspopup="true"
                  onClick={() => setIsCollectionsOpen((open) => !open)}
                  className={`flex items-center gap-1.5 whitespace-nowrap py-3 text-xs font-semibold tracking-wide transition-colors hover:text-[#B8862B] ${
                    isCollectionsOpen || location.pathname.startsWith('/collection') || location.pathname === '/shop'
                      ? 'text-[#B8862B]'
                      : 'text-[#34312e]'
                  }`}
                >
                  Our Collection
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollectionsOpen ? 'rotate-180' : ''}`} />
                </button>
              </li>
              <li>
                <Link
                  to="/about"
                  aria-current={location.pathname === '/about' ? 'page' : undefined}
                  className={`whitespace-nowrap py-3 text-xs font-semibold tracking-wide transition-colors hover:text-[#8d6b36] ${
                    location.pathname === '/about' ? 'text-[#8d6b36]' : 'text-[#34312e]'
                  }`}
                >
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href="/blog"
                  aria-current={location.pathname.startsWith('/blog') ? 'page' : undefined}
                  className={`whitespace-nowrap py-3 text-xs font-semibold tracking-wide transition-colors hover:text-[#8d6b36] ${
                    location.pathname.startsWith('/blog') ? 'text-[#8d6b36]' : 'text-[#34312e]'
                  }`}
                >
                  Blog
                </a>
              </li>
              <li>
                <Link
                  to="/contact"
                  aria-current={location.pathname === '/contact' ? 'page' : undefined}
                  className={`whitespace-nowrap py-3 text-xs font-semibold tracking-wide transition-colors hover:text-[#8d6b36] ${
                    location.pathname === '/contact' ? 'text-[#8d6b36]' : 'text-[#34312e]'
                  }`}
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1 lg:w-[140px]">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden rounded-full p-2 text-sasta-heading transition-colors hover:bg-black/5 lg:inline-flex"
              aria-label="Search products"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              to="/wishlist"
              className="relative hidden rounded-full p-2 text-sasta-heading transition-colors hover:bg-black/5 sm:inline-flex"
              aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
            >
              <Heart className="h-[18px] w-[18px]" />
              {wishlistCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#a4ed00] px-1 text-[9px] font-bold text-black">{wishlistCount}</span>}
            </Link>
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              title={isAuthenticated ? `My account (${user?.name || ''})` : 'Sign in'}
              className="hidden rounded-full p-2 text-sasta-heading transition-colors hover:bg-black/5 xl:inline-flex"
              aria-label={isAuthenticated ? 'My account' : 'Sign in'}
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative rounded-full p-2 text-sasta-heading transition-colors hover:bg-black/5"
              aria-label={`Shopping bag${totalCount ? `, ${totalCount} items` : ''}`}
            >
              <ShoppingBag className="h-[19px] w-[19px]" />
              <span className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#a4ed00] px-1 text-[9px] font-bold text-black">
                {totalCount}
              </span>
            </button>
          </div>
        </div>
        <MegaMenu
          isOpen={isCollectionsOpen}
          pathname={location.pathname}
          onClose={() => setIsCollectionsOpen(false)}
          onMouseEnter={openCollections}
          onMouseLeave={scheduleCloseCollections}
        />
      </header>

      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
