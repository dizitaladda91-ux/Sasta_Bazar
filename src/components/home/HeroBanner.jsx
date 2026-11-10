import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

export default function HeroBanner() {
  const { content: copy } = useStorefrontContent('home_copy');
  const { products: featuredProducts } = useProducts({ filter: 'best-seller', limit: 1 });
  const featured = featuredProducts[0];
  return (
    <section className="relative bg-sasta-yellow-light border-b border-sasta-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left z-10 animate-slide-left">
            <div className="inline-flex items-center gap-2 bg-sasta-yellow-soft/80 border border-sasta-gold/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-sasta-navy tracking-wide">
              
              <span>{copy?.hero?.eyebrow}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-sasta-heading tracking-tight leading-[1.15]">
              {copy?.hero?.title}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-sasta-body max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {copy?.hero?.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                to="/shop"
                className="w-full sm:w-auto bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs sm:text-sm uppercase tracking-wider px-8 py-3.5 rounded-md shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>{copy?.hero?.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/collection/casual-wear"
                className="w-full sm:w-auto bg-white hover:bg-sasta-yellow-cream text-sasta-heading border border-sasta-border font-semibold text-xs sm:text-sm uppercase tracking-wider px-7 py-3.5 rounded-md shadow-xs transition-colors text-center"
              >
                Explore Suits from Â£9.99
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-sasta-muted">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sasta-gold-dark" />
                <span>Best Price Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sasta-gold" />
                <span>Fast Tracked UK Delivery</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sasta-gold" />
                <span>Premium Cotton &amp; Silk</span>
              </div>
            </div>
          </div>

          {/* Image Feature Grid */}
          <div className="lg:col-span-5 relative animate-slide-right">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              {/* Main portrait image */}
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-2xl border-4 border-white bg-neutral-100">
                {featured && <img
                  src={featured?.primaryImage}
                  alt={featured?.title || ''}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />}
                {featured && <div className="absolute bottom-4 left-4 right-4 bg-white/95 text-sasta-heading p-3.5 rounded-lg border border-sasta-border shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sasta-gold-dark block">
                    Best Seller
                  </span>
                  <p className="font-serif text-sm font-bold truncate text-sasta-heading">
                    {featured.title}
                  </p>
                  <p className="text-xs font-bold text-sasta-navy mt-0.5">£{featured.price.toFixed(2)} {featured.compareAtPrice > featured.price && <span className="line-through text-sasta-muted font-normal ml-1">£{featured.compareAtPrice.toFixed(2)}</span>}</p>
                </div>}
              </div>

              {/* Floating secondary badge/card */}
              <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-white p-3 rounded-lg shadow-xl border border-sasta-border max-w-[190px] hidden sm:block animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-sasta-navy uppercase tracking-wider">
                    In High Demand
                  </span>
                </div>
                <p className="text-xs font-bold text-sasta-heading">
                  Pure Cotton 3-Piece Sets
                </p>
                <span className="text-[11px] text-sasta-gold-dark font-extrabold">
                  {featured?.discountPercent}% Off
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
