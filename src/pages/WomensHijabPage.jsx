import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import { useProducts } from '../hooks/useProducts';

export const HIJAB_CATEGORIES = [
  {
    id: 'all',
    label: 'All Hijabs',
    description: 'Explore our complete collection of everyday luxury hijabs crafted for breathable comfort.',
    keywords: []
  },
  {
    id: 'double-stitched',
    label: 'Double Stitched',
    description: 'Durable, neat double-stitched hijabs designed for a clean everyday drape.',
    keywords: ['double stitched', 'double-stitched']
  },
  {
    id: 'linen',
    label: 'Linen',
    description: 'Lightweight, airy linen hijabs ideal for warm weather and effortless styling.',
    keywords: ['linen']
  },
  {
    id: 'jersey',
    label: 'Jersey',
    description: 'Ultra-soft, stretchable jersey hijabs that stay comfortably in place all day.',
    keywords: ['jersey']
  },
  {
    id: 'cotton-silk',
    label: 'Cotton Silk',
    description: 'Smooth cotton silk hijabs with a subtle sheen for festive and formal occasions.',
    keywords: ['cotton silk', 'cotton-silk', 'silk']
  }
];

export default function WomensHijabPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(
    HIJAB_CATEGORIES.some((cat) => cat.id === initialCategory) ? initialCategory : 'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24;

  const { products: allHijabProducts, loading } = useProducts({ collection: 'scarves', limit: 250 });

  useEffect(() => {
    const param = searchParams.get('category') || 'all';
    if (HIJAB_CATEGORIES.some((cat) => cat.id === param)) {
      setSelectedCategory(param);
    }
  }, [searchParams]);

  useEffect(() => {
    document.title = "Women's Hijab | SASTA BAZAAR - Everyday Luxury";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const activeCategory = useMemo(
    () => HIJAB_CATEGORIES.find((cat) => cat.id === selectedCategory) || HIJAB_CATEGORIES[0],
    [selectedCategory]
  );

  const filteredProducts = useMemo(() => {
    if (activeCategory.id === 'all') return allHijabProducts;
    return allHijabProducts.filter((product) => {
      const haystack = `${product.title || ''} ${product.subcategory || ''} ${product.description || ''}`.toLowerCase();
      return activeCategory.keywords.some((kw) => haystack.includes(kw));
    });
  }, [allHijabProducts, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const handleSelectCategory = (id) => {
    setSelectedCategory(id);
    if (id === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: id });
    }
  };

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-sasta-muted mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-sasta-heading">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-sasta-heading">Women&apos;s Hijab</span>
        </nav>

        {/* Page Banner */}
        <div className="bg-sasta-yellow-light p-6 sm:p-10 rounded-xl border border-sasta-border mb-8 text-center max-w-4xl mx-auto shadow-2xs">
          <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
            Everyday Luxury
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-sasta-heading mb-3">
            Women&apos;s Hijab
          </h1>
          <p className="text-xs sm:text-sm text-sasta-body max-w-2xl mx-auto leading-relaxed mb-4">
            {activeCategory.description}
          </p>
          <span className="inline-block text-xs font-semibold text-sasta-navy bg-white/80 border border-sasta-border px-3 py-1 rounded-full">
            {filteredProducts.length} Products Available in GBP (£)
          </span>
        </div>

        {/* 4 Hijab Categories Filter */}
        <div className="mb-10">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8862B] mb-4">
            Shop Hijab By Fabric &amp; Style
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {HIJAB_CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectCategory(category.id)}
                  className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-all border ${
                    isActive
                      ? 'bg-[#B8862B] text-white border-[#B8862B] shadow-sm'
                      : 'bg-[#FFFCF5] text-[#2B2318] border-[#B8862B]/30 hover:bg-[#F6ECD9]'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="min-h-[30vh] grid place-items-center text-sm text-sasta-muted">
            Loading hijabs…
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        ) : (
          <div className="py-20 text-center bg-sasta-yellow-cream/40 rounded-lg border border-dashed border-sasta-border space-y-4">
            <p className="font-serif text-lg font-bold text-sasta-heading">
              New {activeCategory.label} hijabs coming soon!
            </p>
            <p className="text-xs text-sasta-body max-w-sm mx-auto">
              We are adding fresh shades to this hijab category. Explore all our hijabs or shop other collections in the meantime.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className="inline-flex items-center gap-2 bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded shadow-xs"
              >
                View All Hijabs
              </button>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 border border-sasta-border bg-white hover:bg-sasta-yellow-cream text-sasta-heading text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Explore All Products</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
