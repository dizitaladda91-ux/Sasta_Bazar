import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isFavorited = isInWishlist(product.id);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.available) {
      addToCart(product, product.sizes?.[0] || null, product.colors?.[0] || null);
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      className="product-card group relative flex flex-col bg-white rounded-md border border-sasta-border/60 hover:border-sasta-gold/70 hover:shadow-card transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with 2:3 aspect ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-md bg-neutral-100">
        <Link to={`/product/${product.handle}`} className="block w-full h-full">
          {/* Primary Image */}
          <img
            src={product.primaryImage}
            alt={product.title}
            loading="lazy"
            className={`product-card-img absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isHovered && product.hoverImage && product.hoverImage !== product.primaryImage
                ? 'opacity-0'
                : 'opacity-100'
            }`}
          />

          {/* Secondary Hover Image Swap */}
          {product.hoverImage && product.hoverImage !== product.primaryImage && (
            <img
              src={product.hoverImage}
              alt={`${product.title} alternative view`}
              loading="lazy"
              className={`product-card-img absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.discountPercent > 0 && (
            <span className="bg-sasta-gold text-sasta-heading text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded shadow-xs">
              {product.discountPercent}% OFF
            </span>
          )}

          {product.isNewArrival && product.available && (
            <span className="bg-sasta-yellow-cream text-sasta-heading border border-sasta-border text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded shadow-2xs">
              New
            </span>
          )}

          {product.isImagePlaceholder && (
            <span className="bg-amber-100 text-amber-800 text-[8px] font-semibold px-1 py-0.5 rounded">
              Sample View
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all duration-200 z-10 shadow-xs ${
            isFavorited
              ? 'bg-red-50 text-red-500 hover:bg-red-100'
              : 'bg-white/90 text-sasta-heading hover:bg-white hover:text-red-500'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isFavorited ? 'fill-current text-red-500' : ''
            }`}
          />
        </button>

        {/* Quick Add / Select Options overlay button on Desktop */}
        <div className="absolute inset-x-2 bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hidden sm:block">
          {product.available ? (
            <button
              onClick={handleQuickAdd}
              className="w-full bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider py-2.5 rounded shadow-md transition-colors flex items-center justify-center gap-1.5 backdrop-blur-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>
          ) : (
            <div className="w-full bg-neutral-800/90 text-white text-xs font-semibold text-center py-2.5 rounded">
              Out of Stock
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-white">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sasta-muted block mb-1">
            {product.subcategory || product.category}
          </span>
          <Link
            to={`/product/${product.handle}`}
            className="font-medium text-xs sm:text-sm text-sasta-heading hover:text-sasta-gold-dark line-clamp-2 transition-colors mb-2"
            title={product.title}
          >
            {product.title}
          </Link>
        </div>

        <div className="pt-2 border-t border-sasta-border/40 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm sm:text-base text-sasta-heading">
              £{product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-sasta-muted line-through">
                £{product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Mobile quick tap action */}
          <div className="sm:hidden">
            <Link
              to={`/product/${product.handle}`}
              className="text-[11px] font-semibold text-sasta-gold-dark hover:underline flex items-center gap-0.5"
            >
              <span>View</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
