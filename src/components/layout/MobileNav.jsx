import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, Heart, ShoppingBag, ShieldCheck, User } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { MEGA_MENU_CATEGORIES, MEGA_MENU_GROUPS } from '../../data/categories';

export default function MobileNav({ isOpen, onClose }) {
  const [openSections, setOpenSections] = useState({
    collection: false,
    help: false
  });

  const { wishlistCount } = useWishlist();
  const { totalCount, openCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  if (!isOpen) return null;

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xs bg-white text-sasta-heading h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-sasta-border flex items-center justify-between bg-sasta-yellow-cream">
          <Link to="/" onClick={onClose} className="inline-block">
            <img
              src="/logo.png"
              alt="SASTA BAZAAR - Everyday Luxury"
              className="h-12 w-auto object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-sasta-heading hover:bg-white rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action strip: Account, Wishlist, Bag */}
        <div className="grid grid-cols-3 border-b border-sasta-border text-[11px] divide-x divide-sasta-border bg-white">
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            onClick={handleLinkClick}
            className="p-2.5 flex flex-col items-center justify-center gap-1 hover:bg-sasta-yellow-cream transition-colors text-sasta-heading font-medium text-center"
          >
            <User className="w-4 h-4 text-sasta-gold-dark" />
            <span className="truncate max-w-[85px]">
              {isAuthenticated ? user?.name?.split(' ')[0] : 'Sign In'}
            </span>
          </Link>
          <Link
            to="/wishlist"
            onClick={handleLinkClick}
            className="p-2.5 flex flex-col items-center justify-center gap-1 hover:bg-sasta-yellow-cream transition-colors text-sasta-heading font-medium text-center"
          >
            <Heart className="w-4 h-4 text-sasta-gold-dark" />
            <span>Wishlist ({wishlistCount})</span>
          </Link>
          <button
            onClick={() => {
              onClose();
              openCart();
            }}
            className="p-2.5 flex flex-col items-center justify-center gap-1 hover:bg-sasta-yellow-cream transition-colors text-sasta-heading font-medium text-center"
          >
            <ShoppingBag className="w-4 h-4 text-sasta-gold-dark" />
            <span>Bag ({totalCount})</span>
          </button>
        </div>

        {/* Menu Links */}
        <div className="flex-1 py-4 divide-y divide-sasta-border/60">
          {/* Home */}
          <div className="px-4 py-2">
            <Link
              to="/"
              onClick={handleLinkClick}
              className="block text-sm font-semibold uppercase tracking-wider text-sasta-heading hover:text-sasta-gold-dark py-1"
            >
              Home
            </Link>
          </div>

          {/* Categories Accordion */}
          <div className="px-4 py-2">
            <button
              onClick={() => toggleSection('collection')}
              className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-sasta-heading py-2"
            >
              <span>Our Collection</span>
              {openSections.collection ? (
                <ChevronDown className="w-4 h-4 text-sasta-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-sasta-muted" />
              )}
            </button>

            {openSections.collection && (
              <div className="mt-1 space-y-3 pb-3 pt-1 animate-fade-in">
                {MEGA_MENU_GROUPS.map((groupName) => {
                  const items = MEGA_MENU_CATEGORIES.filter((c) => c.group === groupName);
                  return (
                    <div key={groupName} className="space-y-1">
                      <p className="px-1 font-serif text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8862B]">
                        {groupName}
                      </p>
                      {items.map((category) => (
                        <Link
                          key={category.slug}
                          to={category.path}
                          onClick={handleLinkClick}
                          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-xs text-sasta-heading hover:bg-[#F6ECD9]/70 transition-colors"
                        >
                          <img
                            src={category.image}
                            alt=""
                            loading="lazy"
                            className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[#B8862B]/25"
                          />
                          <span className="flex-1 truncate font-medium">{category.name}</span>
                          {category.badge && (
                            <span className="rounded-full bg-[#F6ECD9] px-2 py-0.5 text-[9px] font-bold uppercase text-[#B8862B]">
                              {category.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main pages */}
          <div className="px-4 py-2">
            <Link
              to="/about"
              onClick={handleLinkClick}
              className="block text-sm font-semibold uppercase tracking-wider text-sasta-heading hover:text-sasta-gold-dark py-1"
            >
              About Us
            </Link>
          </div>
          <div className="px-4 py-2">
            <a
              href="/blog"
              onClick={handleLinkClick}
              className="block text-sm font-semibold uppercase tracking-wider text-sasta-heading hover:text-sasta-gold-dark py-1"
            >
              Blog &amp; Style Guides
            </a>
          </div>
          <div className="px-4 py-2">
            <Link
              to="/contact"
              onClick={handleLinkClick}
              className="block text-sm font-semibold uppercase tracking-wider text-sasta-heading hover:text-sasta-gold-dark py-1"
            >
              Contact Us
            </Link>
          </div>

          {/* Help Accordion */}
          <div className="px-4 py-2">
            <button
              onClick={() => toggleSection('help')}
              className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-sasta-heading py-2"
            >
              <span>Help</span>
              {openSections.help ? (
                <ChevronDown className="w-4 h-4 text-sasta-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-sasta-muted" />
              )}
            </button>

            {openSections.help && (
              <div className="pl-3 pb-2 space-y-2 text-xs animate-fade-in border-l border-sasta-gold/40 ml-1 mt-1">
                <Link to="/size-guide" onClick={handleLinkClick} className="block text-sasta-body hover:text-sasta-heading">
                  Size Guide
                </Link>
                <Link to="/shipping-policy" onClick={handleLinkClick} className="block text-sasta-body hover:text-sasta-heading">
                  Shipping &amp; Delivery
                </Link>
                <Link to="/refund-policy" onClick={handleLinkClick} className="block text-sasta-body hover:text-sasta-heading">
                  Returns &amp; Exchanges
                </Link>
                <Link to="/faqs" onClick={handleLinkClick} className="block text-sasta-body hover:text-sasta-heading">
                  Frequently Asked Questions
                </Link>
                <Link to="/care-instructions" onClick={handleLinkClick} className="block text-sasta-body hover:text-sasta-heading">
                  Garment &amp; Fabric Care
                </Link>
                <Link to="/customization" onClick={handleLinkClick} className="block text-sasta-body hover:text-sasta-heading">
                  Customization Requests
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Footer info in drawer */}
        <div className="p-4 bg-sasta-yellow-cream border-t border-sasta-border text-xs text-sasta-body">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-sasta-gold-dark" />
            <span className="font-semibold text-sasta-heading">100% Genuine Quality Guaranteed</span>
          </div>
          <p className="text-[11px] text-sasta-muted">
            Currency: <span className="font-semibold text-sasta-heading">GBP (£)</span> | UK Tracked Dispatch
          </p>
        </div>
      </div>
    </div>
  );
}
