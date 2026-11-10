import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/common/ProductCard';
import { useProducts } from '../hooks/useProducts';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { products } = useProducts();

  // Find full product details for each wishlist item
  const fullProducts = wishlistItems.map(wItem => {
    return products.find(p => p.id === wItem.id);
  }).filter(Boolean);

  return (
    <div className="bg-white min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
            Saved For Later
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-sasta-heading">
            My Wishlist ({wishlistItems.length})
          </h1>
        </div>

        {fullProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {fullProducts.map((product) => (
              <div key={product.id} className="relative flex flex-col">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
            <div className="w-20 h-20 rounded-full bg-sasta-yellow-soft flex items-center justify-center mx-auto text-sasta-gold-dark">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-sasta-heading">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs sm:text-sm text-sasta-body leading-relaxed">
              Save your favorite ethnic suits, lehengas, and hijabs by clicking the heart icon on any product.
            </p>
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-block bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-8 py-3 rounded shadow-xs transition-colors"
              >
                Explore Catalogue
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
