import React, { useEffect } from 'react';
import { Sparkles, Heart, ShieldCheck, Feather } from 'lucide-react';
import TrustStrip from '../components/home/TrustStrip';

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Us | SASTA BAZAAR - Everyday Luxury';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Header */}
      <div className="bg-sasta-yellow-light py-16 sm:py-24 border-b border-sasta-border text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="SASTA BAZAAR - Everyday Luxury"
            className="h-28 sm:h-36 w-auto object-contain mx-auto"
          />
          <span className="text-[11px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block">
            Our Heritage &amp; Vision
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-sasta-heading">
            Everyday Luxury Ethnic Fashion
          </h1>
          <p className="text-xs sm:text-base text-sasta-body leading-relaxed max-w-xl mx-auto">
            Ladies and kids ethnic fashion curated with high quality fabrics, authentic craftsmanship, and honest pricing.
          </p>
        </div>
      </div>

      {/* Main Narrative */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-sasta-heading">
            The Sasta Bazaar Story
          </h2>
          <p className="text-xs sm:text-sm text-sasta-body leading-relaxed">
            Born from the universal need for a destination that honors the timeless beauty of South Asian ethnic fashion while keeping it accessible, comfortable, and affordable. Too often, finding well-stitched ethnic wear meant choosing between exorbitant designer tags or substandard fabrics. Sasta Bazaar bridges this divide by delivering <em>Everyday Luxury</em> directly to your doorstep.
          </p>
          <p className="text-xs sm:text-sm text-sasta-body leading-relaxed">
            Whether it is our signature <strong>Chickenkari Kurta Sets</strong>, celebratory <strong>Embroidered Shararas</strong>, regal <strong>Digital Print Silk Lehengas</strong>, or our ultra-soft <strong>Double Stitched Jersey Hijabs</strong>, each garment is selected for its drape, breathability, and enduring finish.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 bg-sasta-yellow-cream/50 rounded-lg border border-sasta-border space-y-3">
            <Feather className="w-6 h-6 text-sasta-gold-dark" />
            <h3 className="font-serif font-bold text-base text-sasta-heading">
              Pure Comfort Fabrics
            </h3>
            <p className="text-xs text-sasta-body leading-relaxed">
              We prioritize premium breathable cottons, lightweight georgettes, and soft jerseys that feel luxurious all day long.
            </p>
          </div>

          <div className="p-6 bg-sasta-yellow-cream/50 rounded-lg border border-sasta-border space-y-3">
            
            <h3 className="font-serif font-bold text-base text-sasta-heading">
              Intricate Detailing
            </h3>
            <p className="text-xs text-sasta-body leading-relaxed">
              From delicate sequin neckline patches to neat double-stitched hems, our artisans inspect every detail prior to dispatch.
            </p>
          </div>

          <div className="p-6 bg-sasta-yellow-cream/50 rounded-lg border border-sasta-border space-y-3">
            <Heart className="w-6 h-6 text-sasta-gold-dark" />
            <h3 className="font-serif font-bold text-base text-sasta-heading">
              Honest Everyday Pricing
            </h3>
            <p className="text-xs text-sasta-body leading-relaxed">
              We guarantee value: stylish 3-piece complete sets starting at £9.99 and hijabs at £2.99, keeping modest fashion truly accessible.
            </p>
          </div>
        </div>

        {/* Quote Block */}
        <div className="p-8 bg-sasta-yellow-soft/60 rounded-xl border border-sasta-border text-center space-y-3">
          <blockquote className="font-serif italic text-lg sm:text-xl text-sasta-heading">
            "Modesty is not about hiding; it is an enduring statement of grace, identity, and inner confidence."
          </blockquote>
          <span className="text-xs font-bold uppercase tracking-widest text-sasta-gold-dark block">
            &mdash; The Sasta Bazaar Team
          </span>
        </div>
      </div>

      <TrustStrip />
    </div>
  );
}
