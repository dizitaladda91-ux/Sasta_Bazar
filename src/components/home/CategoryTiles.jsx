import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';
import RevealOnScroll from '../common/RevealOnScroll';

export default function CategoryTiles() {
  // 3 prominent tiles like Hijab House's Hijabs/Clothing/Caps pattern
  const { content: categories } = useStorefrontContent('home_categories');
  const { content: copy } = useStorefrontContent('home_copy');
  const topThree = categories?.slice(0, 3) || [];
  const directions = ['left', 'up', 'right'];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1.5">
            {copy?.categories?.eyebrow}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-sasta-heading">
            {copy?.categories?.title}
          </h2>
          <p className="text-xs sm:text-sm text-sasta-body mt-2">
            {copy?.categories?.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 overflow-hidden">
          {topThree.map((cat, idx) => (
            <RevealOnScroll
              key={cat.id}
              direction={directions[idx] || 'up'}
              delay={idx * 120}
              className="h-full flex flex-col"
            >
              <div className="group rounded-xl overflow-hidden border border-sasta-border shadow-xs hover:shadow-card transition-all duration-300 flex flex-col bg-white h-full">
                {/* Image Frame */}
                <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-neutral-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-white text-sasta-navy text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-xs border border-sasta-border">
                      {cat.itemCount}+ Designs
                  </div>
                </div>

                {/* Solid Content Panel */}
                <div className="p-5 sm:p-6 bg-sasta-yellow-cream/40 border-t border-sasta-border text-center flex flex-col items-center flex-1 justify-between">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-sasta-heading mb-1.5">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-sasta-body line-clamp-2 max-w-xs mb-4">
                      {cat.description}
                    </p>
                  </div>

                  <Link
                    to={`/collection/${cat.slug}`}
                    className="inline-flex items-center gap-2 bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-md shadow-xs transition-colors"
                  >
                    <span>Shop All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
