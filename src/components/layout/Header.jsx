import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import MegaMenu from './MegaMenu';
import MobileNav from './MobileNav';
import SearchModal from './SearchModal';

const navigation = [
  { label: 'Shop', to: '/shop' },
  { label: 'Bridal Wear', to: '/collection/lehenga-choli' },
  { label: 'Party Wear', to: '/collection/sharara-gharara-suits' },
  { label: 'Signature Collection', to: '/shop?filter=best-seller' },
  { label: 'Casual Collection', to: '/collection/casual-wear' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Header() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
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
    setIsMegaMenuOpen(false);
    setIsMobileNavOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className={`sticky top-0 z-40 bg-[#fcfaf7] transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="mx-auto flex h-[82px] max-w-[1780px] items-center justify-between gap-3 px-4 sm:h-[96px] sm:px-7 lg:px-10">
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
              <img src="/logo.png" alt="Sasta Bazaar" className="h-[62px] w-auto max-w-[140px] object-contain" />
            </Link>
          </div>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:hidden">
            <img src="/logo.png" alt="Sasta Bazaar" className="h-[54px] w-auto max-w-[130px] object-contain" />
          </Link>

          <nav className="hidden min-w-0 flex-1 lg:block" aria-label="Main navigation">
            <ul className="flex items-center justify-center gap-4 xl:gap-7 2xl:gap-9">
              {navigation.map((item, index) => (
                <li
                  key={item.label}
                  className="shrink-0"
                  onMouseEnter={index === 0 ? () => setIsMegaMenuOpen(true) : undefined}
                >
                  <Link
                    to={item.to}
                    onFocus={index === 0 ? () => setIsMegaMenuOpen(true) : undefined}
                    className="whitespace-nowrap py-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#34312e] transition-colors hover:text-[#8d6b36] xl:text-xs xl:tracking-[0.12em]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
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

        <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
      </header>

      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
