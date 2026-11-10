import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Feather } from 'lucide-react';
import RevealOnScroll from '../common/RevealOnScroll';

export default function EditorialBlocks() {
  return (
    <section className="py-12 sm:py-20 bg-sasta-yellow-cream/40 border-y border-sasta-border space-y-16 sm:space-y-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Block 1: Premium Cotton Wear (Image Right, Text Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-16 sm:mb-24 overflow-hidden">
          <RevealOnScroll direction="left" className="lg:col-span-6 space-y-4 sm:space-y-6 order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] text-sasta-gold-dark uppercase">
              <Feather className="w-4 h-4 text-sasta-gold-dark" />
              <span>Perfect For Every Occasion</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-sasta-heading tracking-tight leading-tight">
              Premium Cotton Wear
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-sasta-body leading-relaxed max-w-xl mx-auto lg:mx-0">
              Experience the perfect blend of comfort, elegance, and craftsmanship with our Premium Cotton Wear collection. Made from high-quality cotton fabrics, each piece is thoughtfully designed to provide all-day comfort while maintaining a sophisticated look.
            </p>

            <p className="text-xs sm:text-sm text-sasta-body leading-relaxed max-w-xl mx-auto lg:mx-0">
              Featuring beautiful embroidery, timeless patterns, and versatile silhouettes, our collection is ideal for everyday wear, festive occasions, and special gatherings. Discover ethnic fashion that feels as good as it looks.
            </p>

            <div className="pt-2">
              <Link
                to="/collection/casual-wear"
                className="inline-flex items-center gap-2 bg-sasta-navy hover:bg-sasta-navy-light text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded shadow-md transition-all group"
              >
                <span>Discover Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </RevealOnScroll>

          <RevealOnScroll direction="right" delay={150} className="lg:col-span-6 order-1 lg:order-2">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-xl border-4 border-white bg-neutral-100">
              <img
                src="https://cdn.shopify.com/s/files/1/1083/5361/8269/files/IMG_3452.jpg?v=1782585999"
                alt="Premium Cotton Wear Collection"
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-sasta-gold text-sasta-heading text-xs font-bold px-3 py-1 uppercase tracking-wider rounded shadow-xs">
                100% Pure Cotton
              </div>
            </div>
          </RevealOnScroll>
        </div>

        {/* Block 2: Redefine Your Style with Modern Comfort (Image Left, Text Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center overflow-hidden">
          <RevealOnScroll direction="left" className="lg:col-span-6">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-xl border-4 border-white bg-neutral-100">
              <img
                src="https://cdn.shopify.com/s/files/1/1083/5361/8269/files/3A946126-52FC-4483-B2FA-DA3763993990.jpg?v=1782935535"
                alt="Modern Comfort Ethnic Wear"
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-sasta-navy text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded shadow-xs">
                Handcrafted Zarkan Work
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll direction="right" delay={150} className="lg:col-span-6 space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] text-sasta-gold-dark uppercase">
              
              <span>Contemporary Grace</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-sasta-heading tracking-tight leading-tight">
              Redefine Your Style with Modern Comfort
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-sasta-body leading-relaxed max-w-xl mx-auto lg:mx-0">
              Celebrate your heritage without compromising on ease. Each suit set features tailored trousers, generous dupattas, and intricate neckline patches adorned with sequins and mirror accents.
            </p>

            <p className="text-xs sm:text-sm text-sasta-body leading-relaxed max-w-xl mx-auto lg:mx-0">
              From slub cotton fabrics to flowing georgette saree-drape dresses, step out in designs that seamlessly carry you from casual luncheons to grand family celebrations.
            </p>

            <div className="pt-2">
              <Link
                to="/collection/salwar-kameez-suit-sets"
                className="inline-flex items-center gap-2 bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded shadow-md transition-all group"
              >
                <span>Explore Salwar Sets</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
