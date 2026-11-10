import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import SectionTitle from '../common/SectionTitle';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

export default function SignatureCollection() {
  const { content: collections } = useStorefrontContent('signature_collections');
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Craftsmanship &amp; Style"
          title="Our Signature Collection"
          subtitle="Explore our most iconic styles, cherished for their flawless draping, intricate embroidery, and breathable textiles."
          linkText="Explore All Categories"
          linkTo="/shop"
          center={true}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {(collections || []).map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="group rounded-lg overflow-hidden border border-sasta-border shadow-xs hover:shadow-card hover:border-sasta-gold transition-all duration-300 flex flex-col bg-white"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-sasta-yellow-light text-sasta-heading text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded border border-sasta-border shadow-2xs">
                    {item.tag}
                  </span>
                </div>
              </div>

              {/* Solid Card Info */}
              <div className="p-3.5 bg-white flex flex-col justify-between flex-1 border-t border-sasta-border">
                <div>
                  <h4 className="font-serif text-sm sm:text-base font-bold leading-tight mb-1 text-sasta-heading group-hover:text-sasta-gold-dark transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-sasta-body line-clamp-1 mb-2.5 font-normal">
                    {item.subtitle}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sasta-navy group-hover:text-sasta-gold-dark group-hover:translate-x-1 transition-all pt-1">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3 text-sasta-gold-dark" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
