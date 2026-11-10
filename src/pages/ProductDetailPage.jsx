import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Ruler,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/common/ProductCard';
import { api } from '../services/api';
import { useProducts } from '../hooks/useProducts';

export default function ProductDetailPage() {
  const { handle } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [productError, setProductError] = useState('');
  const { products: catalogProducts } = useProducts();

  useEffect(() => {
    let active = true;
    setProduct(null);
    setProductError('');
    api.getProduct(handle)
      .then((value) => active && setProduct(value))
      .catch((error) => active && setProductError(error.message));
    return () => { active = false; };
  }, [handle]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = product ? isInWishlist(product.id) : false;
  const availableStock = product?.stock ?? 0;

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImage(0);
    setQuantity(1);
    if (!product) return;
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    document.title = `${product.title} | SASTA BAZAAR`;
  }, [product]);

  // Related products from the same category
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return catalogProducts
      .filter(p => p.id !== product.id && (p.category === product.category || p.subcategory === product.subcategory))
      .slice(0, 4);
  }, [product, catalogProducts]);

  const handleAddToCart = () => {
    if (!product.available || quantity > availableStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!product) return <div className="min-h-[50vh] grid place-items-center text-sm text-sasta-muted">{productError || 'Loading product…'}</div>;

  const imagesList = product.images && product.images.length > 0
    ? product.images
    : [product.primaryImage];

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-sasta-muted mb-6 flex-wrap">
          <Link to="/" className="hover:text-sasta-heading">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop" className="hover:text-sasta-heading">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            to={`/collection/${product.collectionSlug}`}
            className="hover:text-sasta-heading"
          >
            {product.subcategory || product.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-sasta-heading truncate max-w-xs">
            {product.title}
          </span>
        </nav>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 sm:mb-20">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails row/column */}
            {imagesList.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[560px] pb-2 sm:pb-0 shrink-0">
                {imagesList.slice(0, 8).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-26 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === idx
                        ? 'border-sasta-gold shadow-xs'
                        : 'border-sasta-border hover:border-sasta-gold/60 opacity-80'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Frame */}
            <div className="relative flex-1 aspect-[2/3] max-h-[640px] rounded-lg overflow-hidden border border-sasta-border bg-neutral-100 shadow-xs">
              <img
                src={imagesList[selectedImage] || product.primaryImage}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Discount / Status Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {!product.available ? (
                  <span className="bg-neutral-800 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded">
                    Sold Out
                  </span>
                ) : product.discountPercent > 0 ? (
                  <span className="bg-sasta-gold text-sasta-heading text-xs font-bold px-3 py-1 uppercase tracking-wider rounded shadow-xs">
                    {product.discountPercent}% OFF
                  </span>
                ) : null}
              </div>

              {/* Wishlist Button on Image */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md transition-colors ${
                  isFavorited ? 'bg-red-50 text-red-500' : 'bg-white/90 text-sasta-heading hover:bg-white'
                }`}
                aria-label="Toggle Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-sasta-gold-dark block mb-1.5">
                {product.subcategory || product.category}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-sasta-heading leading-tight">
                {product.title}
              </h1>

              {/* Pricing */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-sasta-heading">
                  £{product.price.toFixed(2)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-base sm:text-lg text-sasta-muted line-through">
                    £{product.compareAtPrice.toFixed(2)}
                  </span>
                )}
                {product.discountPercent > 0 && (
                  <span className="bg-sasta-yellow-soft text-amber-900 text-xs font-bold px-2 py-0.5 rounded">
                    Save £{(product.compareAtPrice - product.price).toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-sasta-muted mt-1">
                Prices in GBP (£) inclusive of VAT. Tracked UK shipping calculated at checkout.
              </p>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-sasta-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sasta-heading uppercase tracking-wider">
                    Select Size: <strong className="text-sasta-navy font-bold">{selectedSize}</strong>
                  </span>
                  <Link
                    to="/size-guide"
                    className="inline-flex items-center gap-1 text-sasta-gold-dark hover:underline font-semibold"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[48px] h-10 px-3 text-xs font-bold rounded border transition-all ${
                        selectedSize === s
                          ? 'bg-sasta-navy text-white border-sasta-navy shadow-xs'
                          : 'bg-white text-sasta-heading border-sasta-border hover:border-sasta-gold'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors / Shades Selector (for Hijabs) */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-sasta-border">
                <span className="font-bold text-xs text-sasta-heading uppercase tracking-wider block">
                  Select Shade: <strong className="text-sasta-navy font-bold">{selectedColor}</strong>
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-sasta-border rounded-md">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        selectedColor === c
                          ? 'bg-sasta-gold text-sasta-heading font-bold border-sasta-gold-dark'
                          : 'bg-white text-sasta-body border-sasta-border hover:bg-sasta-yellow-cream'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector and Add to Cart */}
            <div className="space-y-3 pt-3 border-t border-sasta-border">
              <div className="flex items-center gap-4">
                {/* Qty Box */}
                <div className="flex items-center border border-sasta-border rounded-md bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-neutral-100 text-sasta-heading transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-sasta-heading">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    className="p-2.5 hover:bg-neutral-100 text-sasta-heading transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.available || availableStock < 1}
                  className={`flex-1 py-3 px-6 rounded-md font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
                    product.available
                      ? 'bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading cursor-pointer active:scale-[0.99]'
                      : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.available ? 'Add to Bag' : 'Sold Out'}</span>
                </button>

                {/* Share Link */}
                <button
                  onClick={handleShare}
                  className="p-2.5 border border-sasta-border rounded-md hover:bg-sasta-yellow-cream text-sasta-heading transition-colors"
                  title="Share product"
                >
                  {copiedLink ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Special Promotion note for Hijabs */}
              {product.category === 'Scarves' && (
                <div className="p-2.5 bg-sasta-yellow-soft/80 border border-sasta-border rounded text-xs text-amber-900 font-semibold flex items-center gap-2">
                  
                  <span>Bundle Offer: Add 4 hijabs to your bag for just £9.99!</span>
                </div>
              )}
            </div>

            {/* Trust Assurance Bar */}
            <div className="p-3.5 bg-sasta-yellow-cream rounded-md border border-sasta-border space-y-2 text-xs text-sasta-body">
              <div className="flex items-center gap-2 text-sasta-heading font-medium">
                <Truck className="w-4 h-4 text-sasta-gold-dark shrink-0" />
                <span>Fast Tracked UK Dispatch (2-4 business days)</span>
              </div>
              <div className="flex items-center gap-2 text-sasta-heading font-medium">
                <RotateCcw className="w-4 h-4 text-sasta-gold-dark shrink-0" />
                <span>14-day hassle-free return &amp; exchange window</span>
              </div>
              <div className="flex items-center gap-2 text-sasta-heading font-medium">
                <ShieldCheck className="w-4 h-4 text-sasta-gold-dark shrink-0" />
                <span>100% Quality Inspected Ethnic Garment</span>
              </div>
            </div>

            {/* Product Description */}
            <div className="pt-4 border-t border-sasta-border space-y-3">
              <h3 className="font-serif font-bold text-base text-sasta-heading">
                Product Details &amp; Highlights
              </h3>
              <div
                className="prose prose-sm text-xs sm:text-sm text-sasta-body leading-relaxed max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />

              <div className="pt-2 flex flex-wrap gap-4 text-xs text-sasta-muted">
                <Link to="/care-instructions" className="underline hover:text-sasta-heading">
                  Care Instructions
                </Link>
                <Link to="/customization" className="underline hover:text-sasta-heading">
                  Customization Assistance
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-sasta-border">
            <div className="text-center mb-8">
              <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
                You May Also Love
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-sasta-heading">
                Related Styles
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
