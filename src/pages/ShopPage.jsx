import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { useProducts } from '../hooks/useProducts';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [priceRange, setPriceRange] = useState(100);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'featured');
  const { products: catalogProducts } = useProducts();

  const filterParam = searchParams.get('filter'); // 'new' or 'sale'

  useEffect(() => {
    document.title = 'Shop All Products | SASTA BAZAAR - Everyday Luxury';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const categories = [
    'All',
    'Casual Everyday Wear Suits',
    'Salwar Kameez / Suit Sets',
    'Dresses',
    'Lehenga Choli',
    'Sharara & Gharara Suits',
    'Kids Collection',
    'Unstitched Suits',
    'Scarves'
  ];

  const sizes = ['All', 'S', 'M', 'L', 'XL', 'XXL'];

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(product => {
      // Category filter
      if (selectedCategory !== 'All') {
        const matchesCategory =
          product.category === selectedCategory ||
          product.subcategory === selectedCategory;
        if (!matchesCategory) return false;
      }

      // Query Filter Param (e.g. sale, new)
      if (filterParam === 'sale' && product.discountPercent === 0) {
        return false;
      }
      if (filterParam === 'new' && !product.isNewArrival) {
        return false;
      }

      // Size filter
      if (selectedSize !== 'All') {
        if (!product.sizes || !product.sizes.includes(selectedSize)) {
          return false;
        }
      }

      // Price filter
      if (product.price > priceRange) {
        return false;
      }

      // Availability filter
      if (onlyAvailable && !product.available) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'discount') return b.discountPercent - a.discountPercent;
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });
  }, [catalogProducts, selectedCategory, selectedSize, priceRange, onlyAvailable, sortBy, filterParam]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSize('All');
    setPriceRange(100);
    setOnlyAvailable(false);
    setSortBy('featured');
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedSize !== 'All' ||
    priceRange < 100 ||
    onlyAvailable ||
    filterParam;

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-sasta-border pb-6 mb-8 text-center sm:text-left">
          <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
            Catalogue
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-sasta-heading">
                {filterParam === 'sale'
                  ? 'Special Offers & Sale'
                  : filterParam === 'new'
                  ? 'New Arrivals'
                  : selectedCategory !== 'All'
                  ? selectedCategory
                  : 'Shop All Collections'}
              </h1>
              <p className="text-xs sm:text-sm text-sasta-muted mt-1">
                Showing {filteredProducts.length} handcrafted ethnic styles in GBP (£)
              </p>
            </div>

            {/* Mobile Filter Toggle & Sort */}
            <div className="flex items-center justify-center sm:justify-end gap-3 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 bg-sasta-yellow-cream border border-sasta-border px-4 py-2 rounded-md text-xs font-bold text-sasta-heading hover:bg-white"
              >
                <SlidersHorizontal className="w-4 h-4 text-sasta-gold-dark" />
                <span>Filters {hasActiveFilters && '(Active)'}</span>
              </button>

              <div className="flex items-center gap-2 border border-sasta-border rounded-md px-3 py-1.5 bg-white text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-sasta-muted" />
                <label htmlFor="sort-select" className="sr-only">Sort products</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sasta-heading font-medium focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured / Best Sellers</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 pr-4 border-r border-sasta-border">
            <div className="flex items-center justify-between pb-3 border-b border-sasta-border">
              <span className="font-serif font-bold text-sm text-sasta-heading uppercase tracking-wider">
                Refine Selection
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-sasta-heading mb-3">
                Categories
              </h4>
              <div className="space-y-1.5 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat === 'All') setSearchParams({});
                      else setSearchParams({ category: cat });
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded transition-colors flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-sasta-yellow-soft font-bold text-sasta-heading'
                        : 'text-sasta-body hover:bg-sasta-yellow-cream'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-sasta-navy" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="pt-4 border-t border-sasta-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sasta-heading mb-3">
                Size
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`py-1.5 text-xs font-semibold rounded border transition-colors ${
                      selectedSize === s
                        ? 'bg-sasta-navy text-white border-sasta-navy'
                        : 'bg-white text-sasta-heading border-sasta-border hover:border-sasta-gold'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="pt-4 border-t border-sasta-border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sasta-heading">
                <span>Max Price</span>
                <span className="text-sasta-gold-dark font-extrabold text-sm">£{priceRange}.00</span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                step="1"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-sasta-gold cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-sasta-muted">
                <span>£2.00</span>
                <span>£100.00</span>
              </div>
            </div>

            {/* Availability */}
            <div className="pt-4 border-t border-sasta-border">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-sasta-heading select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-sasta-gold focus:ring-sasta-gold"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-9">
            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-sasta-yellow-cream/60 rounded-md border border-sasta-border text-xs">
                <span className="font-semibold text-sasta-heading">Active Filters:</span>
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-white border border-sasta-border px-2 py-1 rounded-full text-sasta-heading">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory('All')}>
                      <X className="w-3 h-3 text-sasta-muted hover:text-red-600" />
                    </button>
                  </span>
                )}
                {selectedSize !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-white border border-sasta-border px-2 py-1 rounded-full text-sasta-heading">
                    Size: {selectedSize}
                    <button onClick={() => setSelectedSize('All')}>
                      <X className="w-3 h-3 text-sasta-muted hover:text-red-600" />
                    </button>
                  </span>
                )}
                {priceRange < 100 && (
                  <span className="inline-flex items-center gap-1 bg-white border border-sasta-border px-2 py-1 rounded-full text-sasta-heading">
                    Under £{priceRange}
                    <button onClick={() => setPriceRange(100)}>
                      <X className="w-3 h-3 text-sasta-muted hover:text-red-600" />
                    </button>
                  </span>
                )}
                {onlyAvailable && (
                  <span className="inline-flex items-center gap-1 bg-white border border-sasta-border px-2 py-1 rounded-full text-sasta-heading">
                    In Stock Only
                    <button onClick={() => setOnlyAvailable(false)}>
                      <X className="w-3 h-3 text-sasta-muted hover:text-red-600" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="ml-auto text-xs font-semibold text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-sasta-yellow-cream/30 rounded-lg border border-dashed border-sasta-border space-y-4">
                <p className="font-serif text-lg text-sasta-heading font-bold">
                  No matching garments found
                </p>
                <p className="text-xs text-sasta-body max-w-sm mx-auto">
                  Try adjusting your price range, clearing size filters, or exploring another collection.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded shadow-xs"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-sasta-border mb-4">
              <h3 className="font-serif font-bold text-base text-sasta-heading">
                Filter Products
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-sasta-muted hover:text-sasta-heading"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filters Content */}
            <div className="space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-sasta-heading mb-2">
                  Category
                </h4>
                <div className="space-y-1 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left py-1.5 px-2 rounded ${
                        selectedCategory === cat
                          ? 'bg-sasta-yellow-soft font-bold'
                          : 'text-sasta-body'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-sasta-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sasta-heading mb-2">
                  Size
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`py-1 text-xs font-semibold rounded border ${
                        selectedSize === s
                          ? 'bg-sasta-navy text-white'
                          : 'border-sasta-border'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-sasta-border">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Max Price</span>
                  <span>£{priceRange}.00</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-sasta-gold"
                />
              </div>

              <div className="pt-4 border-t border-sasta-border">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-sasta-border mt-auto">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full bg-sasta-gold text-sasta-heading font-bold text-xs uppercase py-3 rounded shadow-xs"
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
