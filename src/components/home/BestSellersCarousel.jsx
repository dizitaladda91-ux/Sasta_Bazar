import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionTitle from '../common/SectionTitle';
import ProductCard from '../common/ProductCard';
import { useProducts } from '../../hooks/useProducts';

export default function BestSellersCarousel() {
  const scrollContainerRef = useRef(null);

  const { products } = useProducts({ filter: 'best-seller', limit: 10 });

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-[11px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
              Customer Favorites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-sasta-heading">
              Best Sellers
            </h2>
            <p className="text-xs sm:text-sm text-sasta-body mt-1.5">
              Our most-loved ethnic ensembles, restocked by popular demand.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-sasta-border flex items-center justify-center text-sasta-heading hover:bg-sasta-yellow-cream hover:border-sasta-gold transition-colors shadow-xs"
              aria-label="Previous items"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-sasta-border flex items-center justify-center text-sasta-heading hover:bg-sasta-yellow-cream hover:border-sasta-gold transition-colors shadow-xs"
              aria-label="Next items"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-[240px] sm:w-[280px] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
