import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import MobileNav from './MobileNav';
import SearchModal from './SearchModal';
import { NAV_CATEGORIES } from '../../data/categories';

export default function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className={`sticky top-0 z-40 bg-[#fcfaf7] transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="mx-auto flex h-[82px] max-w-[1780px] items-center justify-between gap-3 px-4 sm:h-[96px] sm:px-7 lg:h-auto lg:min-h-[96px] lg:px-10 lg:py-3">
          <div className="flex shrink-0 items-center gap-1 lg:w-[150px]">
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
              <img src="/logo.png" alt="Sasta Bazaar" className="h-[80px] w-auto max-w-[130px] object-contain mix-blend-multiply" />
            </Link>
          </div>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:hidden">
            <img src="/logo.png" alt="Sasta Bazaar" className="h-[64px] w-auto max-w-[118px] object-contain mix-blend-multiply" />
          </Link>

          <nav className="hidden min-w-0 flex-1 lg:block" aria-label="Main navigation">
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 xl:gap-x-4 2xl:gap-x-5">
              {NAV_CATEGORIES.map((category) => {
                const isActive = category.path === '/shop'
                  ? location.pathname === '/shop'
                  : location.pathname.startsWith(category.path);

                return (
                  <li key={category.path} className="shrink-0">
                    <Link
                      to={category.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={`whitespace-nowrap text-[9px] transition-colors hover:text-[#8d6b36] xl:text-[10px] 2xl:text-[11px] ${
                        isActive ? 'font-semibold text-[#8d6b36]' : 'text-[#514b45]'
                      }`}
                    >
                      {category.name}
                    </Link>
                  </li>
                );
              })}
              <li className="shrink-0">
                <Link
                  to="/contact"
                  className="whitespace-nowrap py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#34312e] transition-colors hover:text-[#8d6b36] xl:text-[10px] xl:tracking-[0.1em] 2xl:text-[11px]"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1 lg:w-[150px]">
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
      </header>

      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
